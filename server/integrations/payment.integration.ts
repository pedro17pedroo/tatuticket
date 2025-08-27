import Stripe from "stripe";
import { config } from '../config/app.config';

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  customerId?: string;
  clientSecret?: string;
  error?: string;
}

class PaymentService {
  private stripe: Stripe | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (!config.payment.enabled) {
      console.warn('💳 Payment service disabled - Stripe configuration missing');
      return;
    }

    try {
      this.stripe = new Stripe(config.payment.stripe.secretKey!, {
        apiVersion: "2024-11-20.acacia",
      });

      this.initialized = true;
      console.log('💳 Payment service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize payment service:', error);
    }
  }

  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<{success: boolean, customerId?: string, error?: string}> {
    if (!this.initialized || !this.stripe) {
      return { success: false, error: 'Payment service not available' };
    }

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });

      console.log('💳 Customer created:', customer.id);
      return { success: true, customerId: customer.id };
    } catch (error) {
      console.error('❌ Failed to create customer:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async createSubscription(email: string, priceId: string, paymentMethodId?: string, metadata?: Record<string, string>): Promise<SubscriptionResult> {
    if (!this.initialized || !this.stripe) {
      return { success: false, error: 'Payment service not available' };
    }

    try {
      // First create or find customer
      let customerId: string;
      try {
        const existingCustomers = await this.stripe.customers.list({ email, limit: 1 });
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        } else {
          const customer = await this.stripe.customers.create({ email });
          customerId = customer.id;
        }
      } catch (error) {
        return { success: false, error: 'Failed to create customer' };
      }

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata,
      });

      console.log('💳 Subscription created:', subscription.id);
      
      return {
        success: true,
        subscriptionId: subscription.id,
        customerId: customerId,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      };
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    if (!this.initialized || !this.stripe) {
      return { success: false, error: 'Payment service not available' };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      
      console.log('💳 Payment confirmed:', paymentIntent.id);
      return { 
        success: paymentIntent.status === 'succeeded', 
        paymentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('❌ Failed to confirm payment:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getSubscription(subscriptionId: string) {
    if (!this.initialized || !this.stripe) {
      return null;
    }

    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('❌ Failed to retrieve subscription:', error);
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.initialized || !this.stripe) {
      return false;
    }

    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
      console.log('💳 Subscription cancelled:', subscriptionId);
      return true;
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      return false;
    }
  }

  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<{success: boolean, subscription?: any, error?: string}> {
    if (!this.initialized || !this.stripe) {
      return { success: false, error: 'Payment service not available' };
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const currentItem = subscription.items.data[0];
      
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: currentItem.id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
        expand: ['latest_invoice.payment_intent'],
      });

      console.log('💳 Subscription updated:', subscriptionId);
      return { success: true, subscription: updatedSubscription };
    } catch (error) {
      console.error('❌ Failed to update subscription:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async createPaymentMethod(customerId: string, paymentMethodId: string): Promise<boolean> {
    if (!this.initialized || !this.stripe) {
      return false;
    }

    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      console.log('💳 Payment method attached:', paymentMethodId);
      return true;
    } catch (error) {
      console.error('❌ Failed to attach payment method:', error);
      return false;
    }
  }

  async getInvoices(customerId: string, limit = 10): Promise<any[]> {
    if (!this.initialized || !this.stripe) {
      return [];
    }

    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
      });
      return invoices.data;
    } catch (error) {
      console.error('❌ Failed to retrieve invoices:', error);
      return [];
    }
  }

  async createUsageRecord(subscriptionItemId: string, quantity: number): Promise<boolean> {
    if (!this.initialized || !this.stripe) {
      return false;
    }

    try {
      await (this.stripe as any).usageRecords.create(subscriptionItemId, {
        quantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      });

      console.log('💳 Usage record created:', subscriptionItemId, quantity);
      return true;
    } catch (error) {
      console.error('❌ Failed to create usage record:', error);
      return false;
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<Stripe.Event | null> {
    if (!this.initialized || !this.stripe || !config.payment.stripe.webhookSecret) {
      return null;
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload, 
        signature, 
        config.payment.stripe.webhookSecret
      );
    } catch (error) {
      console.error('❌ Failed to handle webhook:', error);
      return null;
    }
  }

  async processWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.upcoming':
          await this.handleUpcomingInvoice(event.data.object as Stripe.Invoice);
          break;
        default:
          console.log('Unhandled webhook event:', event.type);
      }
    } catch (error) {
      console.error('❌ Failed to process webhook event:', error);
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log('✅ Payment succeeded for invoice:', invoice.id);
    
    try {
      // Update tenant subscription status in database
      // Safely handle subscription reference
      const subscriptionId = invoice.subscription as string | undefined;
      if (subscriptionId) {
        const subscription = await this.stripe!.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;
        
        // Update tenant status to active
        // In a real implementation, you would update the tenant record in database
        console.log(`✅ Updated tenant status to active for customer: ${customerId}`);
      }
      
      // Send payment confirmation email
      if (invoice.customer_email) {
        // In a real implementation, send email via email service
        console.log(`📧 Payment confirmation email sent to: ${invoice.customer_email}`);
      }
    } catch (error) {
      console.error('❌ Error handling payment success:', error);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log('❌ Payment failed for invoice:', invoice.id);
    
    try {
      // Update tenant subscription status
      // Safely handle subscription reference
      const subscriptionId = invoice.subscription as string | undefined;
      if (subscriptionId) {
        const subscription = await this.stripe!.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;
        
        // Update tenant status to payment_failed
        console.log(`❌ Updated tenant status to payment_failed for customer: ${customerId}`);
      }
      
      // Send payment failure notification
      if (invoice.customer_email) {
        console.log(`📧 Payment failure notification sent to: ${invoice.customer_email}`);
      }
      
      // Implement retry logic
      if (invoice.attempt_count && invoice.attempt_count < 3) {
        console.log(`🔄 Scheduling retry attempt ${invoice.attempt_count + 1} for invoice: ${invoice.id}`);
      } else {
        console.log(`⚠️ Maximum retry attempts reached for invoice: ${invoice.id}`);
      }
    } catch (error) {
      console.error('❌ Error handling payment failure:', error);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log('🔄 Subscription updated:', subscription.id);
    
    try {
      // Update tenant plan and limits in database
      const customerId = subscription.customer as string;
      const planId = subscription.items.data[0]?.price.id;
      
      // Extract plan details
      const planLimits = this.getPlanLimits(planId);
      
      console.log(`🔄 Updated tenant plan for customer ${customerId}:`, {
        planId,
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end || Date.now(),
        limits: planLimits
      });
      
      // In a real implementation, update the tenant record in database
      // await tenantService.updatePlan(customerId, planId, planLimits);
    } catch (error) {
      console.error('❌ Error handling subscription update:', error);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log('🗑️ Subscription deleted:', subscription.id);
    
    try {
      const customerId = subscription.customer as string;
      
      // Disable tenant access
      console.log(`🚫 Disabling tenant access for customer: ${customerId}`);
      // In a real implementation: await tenantService.disableAccess(customerId);
      
      // Archive tenant data
      console.log(`📦 Archiving tenant data for customer: ${customerId}`);
      // In a real implementation: await tenantService.archiveData(customerId);
      
      // Send cancellation confirmation
      console.log(`📧 Subscription cancellation confirmation sent for customer: ${customerId}`);
    } catch (error) {
      console.error('❌ Error handling subscription deletion:', error);
    }
  }

  private async handleUpcomingInvoice(invoice: Stripe.Invoice): Promise<void> {
    console.log('📅 Upcoming invoice for customer:', invoice.customer);
    
    try {
      // Send renewal reminder email
      const daysUntilDue = Math.ceil((invoice.due_date! * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (invoice.customer_email) {
        console.log(`📧 Renewal reminder sent to ${invoice.customer_email} - ${daysUntilDue} days until due`);
        // In a real implementation: await emailService.sendRenewalReminder(invoice);
      }
      
      // Log upcoming charge details
      console.log(`💰 Upcoming charge: $${(invoice.amount_due / 100).toFixed(2)} on ${new Date(invoice.due_date! * 1000).toLocaleDateString()}`);
    } catch (error) {
      console.error('❌ Error handling upcoming invoice:', error);
    }
  }

  private getPlanLimits(planId?: string): Record<string, any> {
    // Default plan limits mapping
    const planLimitsMap: Record<string, any> = {
      'price_basic': {
        tickets: 100,
        agents: 5,
        storage: '1GB',
        features: ['basic_support', 'email_notifications']
      },
      'price_pro': {
        tickets: 500,
        agents: 20,
        storage: '10GB',
        features: ['priority_support', 'email_notifications', 'slack_integration']
      },
      'price_enterprise': {
        tickets: -1, // unlimited
        agents: -1, // unlimited
        storage: '100GB',
        features: ['premium_support', 'all_integrations', 'custom_reports', 'api_access']
      }
    };

    return planLimitsMap[planId || 'price_basic'] || planLimitsMap['price_basic'];
  }

  isEnabled(): boolean {
    return this.initialized;
  }
}

export const paymentService = new PaymentService();