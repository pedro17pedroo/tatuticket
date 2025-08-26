import { storage } from '../storage';
import { InsertTenant, type Tenant, type User, type AuditLog } from '@shared/schema';
import { AppError } from '../middlewares/error.middleware';

export class TenantService {
  static async getAllTenants(): Promise<Tenant[]> {
    return await storage.getAllTenants();
  }

  static async createTenant(tenantData: InsertTenant, ipAddress?: string, userAgent?: string): Promise<Tenant> {
    const tenant = await storage.createTenant(tenantData);
    
    await storage.createAuditLog({
      userId: null,
      tenantId: tenant.id,
      action: "tenant_created",
      resourceType: "tenant",
      resourceId: tenant.id,
      metadata: { name: tenant.name, plan: tenant.plan },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
    
    return tenant;
  }

  static async getTenantById(id: string): Promise<Tenant> {
    const tenant = await storage.getTenant(id);
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }
    return tenant;
  }

  static async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    return await storage.updateTenant(id, updates);
  }

  static async deleteTenant(id: string): Promise<void> {
    const tenant = await storage.getTenant(id);
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }
    
    // Create audit log before deletion
    await storage.createAuditLog({
      userId: null,
      tenantId: id,
      action: "tenant_deleted",
      resourceType: "tenant",
      resourceId: id,
      metadata: { name: tenant.name },
      ipAddress: null,
      userAgent: null,
    });
    
    await storage.deleteTenant(id);
  }

  static async updateTenantStatus(id: string, status: string): Promise<Tenant> {
    const tenant = await storage.updateTenant(id, { status: status as any });
    
    await storage.createAuditLog({
      userId: null,
      tenantId: id,
      action: "tenant_status_updated",
      resourceType: "tenant",
      resourceId: id,
      metadata: { status },
      ipAddress: null,
      userAgent: null,
    });
    
    return tenant;
  }

  static async updateTenantPlan(id: string, plan: string): Promise<Tenant> {
    const tenant = await storage.updateTenant(id, { plan: plan as any });
    
    await storage.createAuditLog({
      userId: null,
      tenantId: id,
      action: "tenant_plan_updated",
      resourceType: "tenant",
      resourceId: id,
      metadata: { plan },
      ipAddress: null,
      userAgent: null,
    });
    
    return tenant;
  }

  static async overrideTenantSettings(id: string, settings: Record<string, any>): Promise<Tenant> {
    const tenant = await storage.updateTenant(id, { settings });
    
    await storage.createAuditLog({
      userId: null,
      tenantId: id,
      action: "tenant_settings_override",
      resourceType: "tenant",
      resourceId: id,
      metadata: { settings },
      ipAddress: null,
      userAgent: null,
    });
    
    return tenant;
  }

  static async getTenantUsers(tenantId: string): Promise<User[]> {
    return await storage.getUsersByTenant(tenantId);
  }

  static async suspendTenant(id: string): Promise<Tenant> {
    return await this.updateTenantStatus(id, 'suspended');
  }

  static async activateTenant(id: string): Promise<Tenant> {
    return await this.updateTenantStatus(id, 'active');
  }

  static async getTenantAuditLogs(tenantId: string): Promise<AuditLog[]> {
    return await storage.getAuditLogsByTenant(tenantId);
  }

  static async getTenantAnalytics(tenantId: string): Promise<any> {
    const users = await storage.getUsersByTenant(tenantId);
    const tickets = await storage.getTicketsByTenant(tenantId);
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
      resolvedTickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      avgResolutionTime: tickets
        .filter(t => t.resolvedAt)
        .reduce((acc, t) => {
          const created = new Date(t.createdAt).getTime();
          const resolved = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date().getTime();
          return acc + (resolved - created) / (1000 * 60 * 60); // hours
        }, 0) / Math.max(tickets.filter(t => t.resolvedAt).length, 1)
    };
  }

  static async getTenantBySlug(slug: string): Promise<Tenant> {
    const tenant = await storage.getTenantBySlug(slug);
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }
    return tenant;
  }
}