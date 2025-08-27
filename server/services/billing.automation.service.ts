import { storage } from '../storage.js';
// import { emailService } from './email.service.js'; // Will be implemented when email service is configured
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-07-30.basil',
});

interface UsageMetrics {
  tenantId: string;
  tickets: number;
  slaHours: number;
  storage: number; // in MB
  apiCalls: number;
}

interface BillingRule {
  type: 'sla_hours' | 'tickets' | 'storage' | 'api_calls';
  limit: number;
  costPerUnit: number;
  currency: 'AOA' | 'USD';
}

export class BillingAutomationService {
  private billingRules: Record<string, BillingRule[]> = {
    'freemium': [
      { type: 'tickets', limit: 50, costPerUnit: 1000.00, currency: 'AOA' },
      { type: 'sla_hours', limit: 20, costPerUnit: 4000.00, currency: 'AOA' },
      { type: 'storage', limit: 1000, costPerUnit: 50.00, currency: 'AOA' }
    ],
    'pro': [
      { type: 'tickets', limit: 500, costPerUnit: 750.00, currency: 'AOA' },
      { type: 'sla_hours', limit: 80, costPerUnit: 3250.00, currency: 'AOA' },
      { type: 'storage', limit: 5000, costPerUnit: 40.00, currency: 'AOA' },
      { type: 'api_calls', limit: 10000, costPerUnit: 5.00, currency: 'AOA' }
    ],
    'enterprise': [
      { type: 'tickets', limit: 2000, costPerUnit: 500.00, currency: 'AOA' },
      { type: 'sla_hours', limit: 200, costPerUnit: 2500.00, currency: 'AOA' },
      { type: 'storage', limit: 20000, costPerUnit: 25.00, currency: 'AOA' },
      { type: 'api_calls', limit: 50000, costPerUnit: 2.50, currency: 'AOA' }
    ]
  };

  /**
   * Calculate usage for a specific tenant
   */
  async calculateTenantUsage(tenantId: string): Promise<UsageMetrics> {
    try {
      const tickets = await storage.getTicketsByTenant(tenantId);
      const users = await storage.getUsersByTenant(tenantId);
      
      // Calculate usage metrics (simplified for demo)
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      const monthlyTickets = tickets.filter((ticket: any) => 
        new Date(ticket.createdAt) >= monthStart
      ).length;
      
      // Mock calculations for demo purposes
      const slaHours = Math.round(monthlyTickets * 0.5 + users.length * 2);
      const storage = Math.round(monthlyTickets * 0.1 + users.length * 0.5);
      const apiCalls = monthlyTickets * 15 + users.length * 100;

      return {
        tenantId,
        tickets: monthlyTickets,
        slaHours,
        storage,
        apiCalls
      };
    } catch (error) {
      console.error(`Error calculating usage for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate overage charges for a tenant
   */
  async calculateOverageCharges(tenantId: string): Promise<Array<{
    type: string;
    overageAmount: number;
    costPerUnit: number;
    totalCost: number;
    description: string;
  }>> {
    try {
      const tenant = await storage.getTenantById(tenantId);
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const usage = await this.calculateTenantUsage(tenantId);
      const rules = this.billingRules[tenant.plan as keyof typeof this.billingRules] || [];
      
      const overageCharges = [];

      for (const rule of rules) {
        const usedAmount = usage[rule.type as keyof UsageMetrics] as number;
        if (usedAmount > rule.limit) {
          const overageAmount = usedAmount - rule.limit;
          const totalCost = overageAmount * rule.costPerUnit;
          
          overageCharges.push({
            type: rule.type,
            overageAmount,
            costPerUnit: rule.costPerUnit,
            totalCost,
            description: this.getOverageDescription(rule.type, overageAmount, rule.costPerUnit)
          });
        }
      }

      return overageCharges;
    } catch (error) {
      console.error(`Error calculating overage charges for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Process automatic billing for all tenants
   */
  async processAutomaticBilling(): Promise<void> {
    try {
      console.log('🔄 Starting automatic billing process...');
      
      const tenants = await storage.getAllTenants();
      const activeTenants = tenants.filter(tenant => tenant.status === 'active');
      
      console.log(`📊 Processing billing for ${activeTenants.length} active tenants`);
      
      for (const tenant of activeTenants) {
        try {
          await this.processTenantBilling(tenant.id);
        } catch (error) {
          console.error(`❌ Error processing billing for tenant ${tenant.id}:`, error);
          // Continue with other tenants even if one fails
        }
      }
      
      console.log('✅ Automatic billing process completed');
    } catch (error) {
      console.error('❌ Error in automatic billing process:', error);
      throw error;
    }
  }

  /**
   * Process billing for a specific tenant
   */
  async processTenantBilling(tenantId: string): Promise<void> {
    try {
      const tenant = await storage.getTenantById(tenantId);
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const overageCharges = await this.calculateOverageCharges(tenantId);
      
      if (overageCharges.length === 0) {
        console.log(`✅ No overage charges for tenant ${tenant.name}`);
        return;
      }

      const totalOverageAmount = overageCharges.reduce((sum, charge) => sum + charge.totalCost, 0);
      
      console.log(`💳 Processing ${overageCharges.length} overage charges for ${tenant.name} (Total: Kz ${totalOverageAmount.toFixed(2)})`);

      // Create invoice items in Stripe (if configured)
      if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_mock') {
        await this.createStripeInvoiceItems(tenant, overageCharges);
      }

      // Send notification email
      await this.sendBillingNotification(tenant, overageCharges, totalOverageAmount);

      // Create audit log
      await storage.createAuditLog({
        userId: null,
        tenantId: tenant.id,
        action: 'automatic_billing_processed',
        resourceType: 'billing',
        resourceId: `billing_${Date.now()}`,
        metadata: {
          overageCharges,
          totalAmount: totalOverageAmount,
          processedAt: new Date().toISOString()
        },
        ipAddress: null,
        userAgent: 'BillingAutomationService'
      });

    } catch (error) {
      console.error(`Error processing billing for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Create Stripe invoice items for overage charges
   */
  private async createStripeInvoiceItems(tenant: any, overageCharges: any[]): Promise<void> {
    try {
      if (!tenant.stripeCustomerId) {
        console.warn(`No Stripe customer ID for tenant ${tenant.name}`);
        return;
      }

      for (const charge of overageCharges) {
        await stripe.invoiceItems.create({
          customer: tenant.stripeCustomerId,
          amount: Math.round(charge.totalCost * 100), // Convert to cents
          currency: 'aoa',
          description: charge.description,
          metadata: {
            tenant_id: tenant.id,
            usage_type: charge.type,
            overage_amount: charge.overageAmount.toString(),
            cost_per_unit: charge.costPerUnit.toString()
          }
        });
      }

      console.log(`✅ Created ${overageCharges.length} Stripe invoice items for ${tenant.name}`);
    } catch (error) {
      console.error(`Error creating Stripe invoice items for tenant ${tenant.id}:`, error);
      throw error;
    }
  }

  /**
   * Send billing notification email
   */
  private async sendBillingNotification(tenant: any, overageCharges: any[], totalAmount: number): Promise<void> {
    try {
      const tenantUsers = await storage.getUsersByTenant(tenant.id);
      const adminUsers = tenantUsers.filter(user => user.role === 'admin' || user.role === 'super_admin');
      
      if (adminUsers.length === 0) {
        console.warn(`No admin users found for tenant ${tenant.name}`);
        return;
      }

      const emailContent = this.generateBillingEmailContent(tenant, overageCharges, totalAmount);
      
      for (const admin of adminUsers) {
        await emailService.sendEmail({
          to: admin.email,
          subject: `💳 Cobrança por Excesso de Uso - ${tenant.name}`,
          html: emailContent,
          text: `Você possui cobranças de excesso de uso no valor de Kz ${totalAmount.toFixed(2)}.`
        });
      }

      console.log(`📧 Sent billing notifications to ${adminUsers.length} admin(s) for ${tenant.name}`);
    } catch (error) {
      console.error(`Error sending billing notification for tenant ${tenant.id}:`, error);
      // Don't throw - email failures shouldn't stop billing process
    }
  }

  /**
   * Generate email content for billing notification
   */
  private generateBillingEmailContent(tenant: any, overageCharges: any[], totalAmount: number): string {
    const chargesHtml = overageCharges.map(charge => 
      `<li><strong>${this.getOverageTypeLabel(charge.type)}:</strong> ${charge.overageAmount} unidades excedentes × Kz ${charge.costPerUnit} = <strong>Kz ${charge.totalCost.toFixed(2)}</strong></li>`
    ).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">💳 Cobrança por Excesso de Uso</h2>
        
        <p>Olá,</p>
        
        <p>Identificamos uso excedente em sua conta <strong>${tenant.name}</strong> no período atual.</p>
        
        <h3>Detalhes das Cobranças:</h3>
        <ul style="line-height: 1.6;">
          ${chargesHtml}
        </ul>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0; color: #1f2937;">Total a Pagar: <span style="color: #dc2626;">Kz ${totalAmount.toFixed(2)}</span></h3>
        </div>
        
        <p>Esta cobrança será adicionada à sua próxima fatura mensal. Para visualizar detalhes completos, acesse o portal do cliente.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Esta é uma notificação automática do sistema TatuTicket.<br>
            Para dúvidas, entre em contato com o suporte.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Get user-friendly description for overage charges
   */
  private getOverageDescription(type: string, amount: number, costPerUnit: number): string {
    const typeLabels = {
      'tickets': 'tickets excedentes',
      'sla_hours': 'horas SLA excedentes',
      'storage': 'MB de armazenamento excedente',
      'api_calls': 'chamadas API excedentes'
    };
    
    return `${amount} ${typeLabels[type as keyof typeof typeLabels] || type} × Kz ${costPerUnit.toFixed(2)}`;
  }

  /**
   * Get user-friendly label for overage type
   */
  private getOverageTypeLabel(type: string): string {
    const typeLabels = {
      'tickets': 'Tickets',
      'sla_hours': 'Horas SLA',
      'storage': 'Armazenamento',
      'api_calls': 'Chamadas API'
    };
    
    return typeLabels[type as keyof typeof typeLabels] || type;
  }

  /**
   * Schedule automatic billing (called by cron job or scheduler)
   */
  async scheduleAutomaticBilling(): Promise<void> {
    try {
      // Run automatic billing on the 1st of every month
      const now = new Date();
      const isFirstOfMonth = now.getDate() === 1;
      
      if (isFirstOfMonth) {
        console.log('📅 Running scheduled automatic billing...');
        await this.processAutomaticBilling();
      } else {
        console.log('📅 Not first of month, skipping automatic billing');
      }
    } catch (error) {
      console.error('❌ Error in scheduled automatic billing:', error);
    }
  }

  /**
   * Get billing summary for a tenant
   */
  async getBillingSummary(tenantId: string): Promise<{
    usage: UsageMetrics;
    overageCharges: any[];
    totalOverage: number;
    nextBillingDate: string;
  }> {
    try {
      const usage = await this.calculateTenantUsage(tenantId);
      const overageCharges = await this.calculateOverageCharges(tenantId);
      const totalOverage = overageCharges.reduce((sum, charge) => sum + charge.totalCost, 0);
      
      // Calculate next billing date (1st of next month)
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      
      return {
        usage,
        overageCharges,
        totalOverage,
        nextBillingDate: nextMonth.toISOString()
      };
    } catch (error) {
      console.error(`Error getting billing summary for tenant ${tenantId}:`, error);
      throw error;
    }
  }
}

export const billingAutomationService = new BillingAutomationService();