import { 
  users, tenants, tickets, departments, teams, customers, knowledgeArticles, slaConfigs, auditLogs, otpCodes,
  type User, type InsertUser, type Tenant, type InsertTenant, type Ticket, type InsertTicket,
  type Department, type InsertDepartment, type Team, type InsertTeam, type Customer, type InsertCustomer,
  type KnowledgeArticle, type InsertKnowledgeArticle, type SlaConfig, type InsertSlaConfig,
  type AuditLog, type OtpCode, type InsertOtpCode
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getUsersByTenant(tenantId: string): Promise<User[]>;

  // Tenants
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant>;
  getAllTenants(): Promise<Tenant[]>;
  getTenantsByStripeSubscription(subscriptionId: string): Promise<Tenant[]>;

  // Tickets
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket>;
  getTicketsByTenant(tenantId: string): Promise<Ticket[]>;
  getTicketsByCustomer(customerId: string): Promise<Ticket[]>;
  getTicketsByAssignee(assigneeId: string): Promise<Ticket[]>;

  // Departments
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  getDepartmentsByTenant(tenantId: string): Promise<Department[]>;

  // Teams
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamsByDepartment(departmentId: string): Promise<Team[]>;
  getTeamsByTenant(tenantId: string): Promise<Team[]>;

  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomersByTenant(tenantId: string): Promise<Customer[]>;

  // Knowledge Articles
  getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined>;
  createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle>;
  updateKnowledgeArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle>;
  deleteKnowledgeArticle(id: string): Promise<void>;
  updateKnowledgeArticleStatus(id: string, status: string): Promise<KnowledgeArticle>;
  incrementKnowledgeArticleViews(id: string): Promise<void>;
  getKnowledgeArticlesByTenant(tenantId: string): Promise<KnowledgeArticle[]>;

  // SLA Configs
  getSlaConfig(id: string): Promise<SlaConfig | undefined>;
  createSlaConfig(slaConfig: InsertSlaConfig): Promise<SlaConfig>;
  getSlaConfigsByTenant(tenantId: string): Promise<SlaConfig[]>;

  // Audit Logs
  createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  getAuditLogsByTenant(tenantId: string): Promise<AuditLog[]>;

  // OTP Codes
  createOtpCode(otp: InsertOtpCode): Promise<OtpCode>;
  verifyOtpCode(email: string, code: string, type: string): Promise<OtpCode | null>;
  markOtpAsUsed(id: string): Promise<void>;
  incrementOtpAttempts(id: string): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;

  // Analytics
  getTicketStats(tenantId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    avgResolutionTime: number;
  }>;
  getTenantStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalTickets: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || undefined;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return tenant || undefined;
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(insertTenant).returning();
    return tenant;
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    const [tenant] = await db.update(tenants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    // Generate ticket number
    const ticketNumber = `TT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const [ticket] = await db.insert(tickets)
      .values({ ...insertTicket, ticketNumber })
      .returning();
    return ticket;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const [ticket] = await db.update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  async getTicketsByTenant(tenantId: string): Promise<Ticket[]> {
    return await db.select().from(tickets)
      .where(eq(tickets.tenantId, tenantId))
      .orderBy(desc(tickets.createdAt));
  }

  async getTicketsByCustomer(customerId: string): Promise<Ticket[]> {
    return await db.select().from(tickets)
      .where(eq(tickets.customerId, customerId))
      .orderBy(desc(tickets.createdAt));
  }

  async getTicketsByAssignee(assigneeId: string): Promise<Ticket[]> {
    return await db.select().from(tickets)
      .where(eq(tickets.assigneeId, assigneeId))
      .orderBy(desc(tickets.createdAt));
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(insertDepartment).returning();
    return department;
  }

  async getDepartmentsByTenant(tenantId: string): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.tenantId, tenantId));
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(insertTeam).returning();
    return team;
  }

  async getTeamsByDepartment(departmentId: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.departmentId, departmentId));
  }

  async getTeamsByTenant(tenantId: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.tenantId, tenantId));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async getCustomersByTenant(tenantId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.tenantId, tenantId));
  }

  async getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined> {
    const [article] = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, id));
    return article || undefined;
  }

  async createKnowledgeArticle(insertArticle: InsertKnowledgeArticle): Promise<KnowledgeArticle> {
    const [article] = await db.insert(knowledgeArticles).values(insertArticle).returning();
    return article;
  }

  async updateKnowledgeArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    // Always update the updatedAt timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };
    
    const [article] = await db.update(knowledgeArticles)
      .set(updatesWithTimestamp)
      .where(eq(knowledgeArticles.id, id))
      .returning();
    
    if (!article) {
      throw new Error('Article not found');
    }
    
    return article;
  }

  async deleteKnowledgeArticle(id: string): Promise<void> {
    await db.delete(knowledgeArticles).where(eq(knowledgeArticles.id, id));
  }

  async updateKnowledgeArticleStatus(id: string, status: string): Promise<KnowledgeArticle> {
    const [article] = await db.update(knowledgeArticles)
      .set({ status, updatedAt: new Date() })
      .where(eq(knowledgeArticles.id, id))
      .returning();
    
    if (!article) {
      throw new Error('Article not found');
    }
    
    return article;
  }

  async incrementKnowledgeArticleViews(id: string): Promise<void> {
    await db.update(knowledgeArticles)
      .set({ viewCount: sql`${knowledgeArticles.viewCount} + 1` })
      .where(eq(knowledgeArticles.id, id));
  }

  async getKnowledgeArticlesByTenant(tenantId: string): Promise<KnowledgeArticle[]> {
    return await db.select().from(knowledgeArticles)
      .where(eq(knowledgeArticles.tenantId, tenantId))
      .orderBy(desc(knowledgeArticles.createdAt));
  }

  async getSlaConfig(id: string): Promise<SlaConfig | undefined> {
    const [slaConfig] = await db.select().from(slaConfigs).where(eq(slaConfigs.id, id));
    return slaConfig || undefined;
  }

  async createSlaConfig(insertSlaConfig: InsertSlaConfig): Promise<SlaConfig> {
    const [slaConfig] = await db.insert(slaConfigs).values(insertSlaConfig).returning();
    return slaConfig;
  }

  async getSlaConfigsByTenant(tenantId: string): Promise<SlaConfig[]> {
    return await db.select().from(slaConfigs).where(eq(slaConfigs.tenantId, tenantId));
  }

  async createAuditLog(logData: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(logData).returning();
    return log;
  }

  async getAuditLogsByTenant(tenantId: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(eq(auditLogs.tenantId, tenantId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);
  }

  async getTicketStats(tenantId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    avgResolutionTime: number;
  }> {
    const stats = await db.select({
      total: count(),
      open: sql<number>`count(*) filter (where status = 'open')`,
      inProgress: sql<number>`count(*) filter (where status = 'in_progress')`,
      resolved: sql<number>`count(*) filter (where status = 'resolved')`,
      avgResolutionTime: sql<number>`avg(extract(epoch from (resolved_at - created_at)) / 3600) filter (where resolved_at is not null)`,
    }).from(tickets).where(eq(tickets.tenantId, tenantId));

    return stats[0] || { total: 0, open: 0, inProgress: 0, resolved: 0, avgResolutionTime: 0 };
  }

  async getTenantStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalTickets: number;
  }> {
    const [tenantStats] = await db.select({
      totalTenants: count(),
      activeTenants: sql<number>`count(*) filter (where status = 'active')`,
    }).from(tenants);

    const [userStats] = await db.select({
      totalUsers: count(),
    }).from(users);

    const [ticketStats] = await db.select({
      totalTickets: count(),
    }).from(tickets);

    return {
      totalTenants: tenantStats?.totalTenants || 0,
      activeTenants: tenantStats?.activeTenants || 0,
      totalUsers: userStats?.totalUsers || 0,
      totalTickets: ticketStats?.totalTickets || 0,
    };
  }

  // OTP methods
  async createOtpCode(otp: InsertOtpCode): Promise<OtpCode> {
    const [created] = await db.insert(otpCodes).values(otp).returning();
    return created;
  }

  async verifyOtpCode(email: string, code: string, type: string): Promise<OtpCode | null> {
    const [otpRecord] = await db.select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          eq(otpCodes.code, code),
          eq(otpCodes.type, type),
          eq(otpCodes.isUsed, false),
          sql`expires_at > now()`
        )
      );
    
    return otpRecord || null;
  }

  async markOtpAsUsed(id: string): Promise<void> {
    await db.update(otpCodes)
      .set({ isUsed: true })
      .where(eq(otpCodes.id, id));
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await db.update(otpCodes)
      .set({ attempts: sql`attempts + 1` })
      .where(eq(otpCodes.id, id));
  }

  async cleanupExpiredOtps(): Promise<void> {
    await db.delete(otpCodes)
      .where(sql`expires_at < now() OR is_used = true`);
  }

  async getTenantsByStripeSubscription(subscriptionId: string): Promise<Tenant[]> {
    return await db.select().from(tenants).where(eq(tenants.stripeSubscriptionId, subscriptionId));
  }
}

export const storage = new DatabaseStorage();
