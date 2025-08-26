import { storage } from '../storage';
import { InsertTenant, type Tenant } from '@shared/schema';
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

  static async getTenantBySlug(slug: string): Promise<Tenant> {
    const tenant = await storage.getTenantBySlug(slug);
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }
    return tenant;
  }
}