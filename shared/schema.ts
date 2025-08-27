import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table - global users across all tenants
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // user, agent, manager, admin, super_admin
  tenantId: varchar("tenant_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenants table - organizations/companies
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // for subdomain
  plan: text("plan").notNull().default("freemium"), // freemium, pro, enterprise
  status: text("status").notNull().default("active"), // active, suspended, trial
  settings: jsonb("settings"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Departments within tenants
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  tenantId: varchar("tenant_id").notNull(),
  managerEmail: text("manager_email"),
  slaConfig: jsonb("sla_config"), // { criticalHours, highHours, mediumHours, lowHours }
  status: text("status").notNull().default("active"), // active, inactive
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teams within departments
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  departmentId: varchar("department_id").notNull(),
  tenantId: varchar("tenant_id").notNull(),
  leaderId: varchar("leader_id"), // team leader user id
  maxCapacity: integer("max_capacity").default(5),
  currentSize: integer("current_size").default(0),
  specialties: jsonb("specialties"), // array of specializations
  status: text("status").notNull().default("active"), // active, inactive
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tickets
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: text("ticket_number").notNull().unique(), // TT-2024-001
  subject: text("subject").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  category: text("category"),
  tenantId: varchar("tenant_id").notNull(),
  customerId: varchar("customer_id"), // who created the ticket
  assigneeId: varchar("assignee_id"), // assigned agent
  departmentId: varchar("department_id"),
  teamId: varchar("team_id"),
  slaDeadline: timestamp("sla_deadline"),
  timeSpent: decimal("time_spent", { precision: 10, scale: 2 }).default("0"), // hours
  cost: decimal("cost", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// SLA configurations
export const slaConfigs = pgTable("sla_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tenantId: varchar("tenant_id").notNull(),
  priority: text("priority").notNull(), // low, medium, high, critical
  responseTime: integer("response_time").notNull(), // in hours
  resolutionTime: integer("resolution_time").notNull(), // in hours
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer organizations (clients of tenants)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  tenantId: varchar("tenant_id").notNull(),
  tier: text("tier").default("standard"), // standard, premium, enterprise
  hoursBankBalance: decimal("hours_bank_balance", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge base articles
export const knowledgeArticles = pgTable("knowledge_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  slug: text("slug").notNull(),
  tenantId: varchar("tenant_id").notNull(),
  authorId: varchar("author_id").notNull(),
  status: text("status").notNull().default("draft"), // draft, published, archived, pending_approval
  isPublic: boolean("is_public").default(false),
  viewCount: integer("view_count").default(0),
  version: integer("version").default(1),
  parentId: varchar("parent_id"), // For revisions
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Article versions for history tracking
export const articleVersions = pgTable("article_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull(),
  version: integer("version").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  changeNote: text("change_note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Approval workflows
export const approvalWorkflows = pgTable("approval_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceType: text("resource_type").notNull(), // knowledge_article, etc
  resourceId: varchar("resource_id").notNull(),
  tenantId: varchar("tenant_id").notNull(),
  requesterId: varchar("requester_id").notNull(),
  approverId: varchar("approver_id"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  tenantId: varchar("tenant_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type"), // ticket, user, tenant, etc.
  resourceId: varchar("resource_id"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// OTP verification codes
export const otpCodes = pgTable("otp_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  code: text("code").notNull(),
  type: text("type").notNull(), // email_verification, password_reset, login_2fa
  attempts: integer("attempts").default(0),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  assignedTickets: many(tickets, { relationName: "assignee" }),
  createdTickets: many(tickets, { relationName: "customer" }),
  knowledgeArticles: many(knowledgeArticles),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  departments: many(departments),
  tickets: many(tickets),
  customers: many(customers),
  slaConfigs: many(slaConfigs),
  knowledgeArticles: many(knowledgeArticles),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  tenant: one(tenants, { fields: [departments.tenantId], references: [tenants.id] }),
  teams: many(teams),
  tickets: many(tickets),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  department: one(departments, { fields: [teams.departmentId], references: [departments.id] }),
  tenant: one(tenants, { fields: [teams.tenantId], references: [tenants.id] }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  tenant: one(tenants, { fields: [tickets.tenantId], references: [tenants.id] }),
  customer: one(users, { fields: [tickets.customerId], references: [users.id], relationName: "customer" }),
  assignee: one(users, { fields: [tickets.assigneeId], references: [users.id], relationName: "assignee" }),
  department: one(departments, { fields: [tickets.departmentId], references: [departments.id] }),
  team: one(teams, { fields: [tickets.teamId], references: [teams.id] }),
}));

export const customersRelations = relations(customers, ({ one }) => ({
  tenant: one(tenants, { fields: [customers.tenantId], references: [tenants.id] }),
}));

export const knowledgeArticlesRelations = relations(knowledgeArticles, ({ one }) => ({
  tenant: one(tenants, { fields: [knowledgeArticles.tenantId], references: [tenants.id] }),
  author: one(users, { fields: [knowledgeArticles.authorId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  approvedAt: true,
});

export const insertArticleVersionSchema = createInsertSchema(articleVersions).omit({
  id: true,
  createdAt: true,
});

export const insertApprovalWorkflowSchema = createInsertSchema(approvalWorkflows).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertSlaConfigSchema = createInsertSchema(slaConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({
  id: true,
  createdAt: true,
});

// Types for frontend
export type User = typeof users.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type ArticleVersion = typeof articleVersions.$inferSelect;
export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type SlaConfig = typeof slaConfigs.$inferSelect;
export type OtpCode = typeof otpCodes.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;
export type InsertArticleVersion = z.infer<typeof insertArticleVersionSchema>;
export type InsertApprovalWorkflow = z.infer<typeof insertApprovalWorkflowSchema>;
export type InsertSlaConfig = z.infer<typeof insertSlaConfigSchema>;
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;

// Advanced AI and Analytics Types
export interface TicketAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: number;
  category: string;
  suggestedActions: string[];
  duplicateTickets: string[];
  estimatedResolutionTime: number;
  requiredExpertise: string[];
}

export interface SLAPrediction {
  ticketId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedResolutionHours: number;
  confidencePercentage: number;
  timeToBreachHours: number;
  riskFactors: string[];
  recommendedActions: string[];
}

export interface CustomerInsight {
  customerId: string;
  satisfactionScore: number;
  churnRisk: number;
  preferredChannels: string[];
  responseTimePreference: 'fast' | 'standard' | 'flexible';
  complexityPreference: 'simple' | 'detailed';
  historicalPatterns: {
    commonIssues: string[];
    averageResolutionTime: number;
    escalationRate: number;
  };
}

export interface KnowledgeBaseSuggestion {
  id: string;
  title: string;
  relevanceScore: number;
  summary: string;
  category: string;
  tags: string[];
}

// Financial Dashboard Types
export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurring: number;
  growth: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  conversionRate?: number;
  customerAcquisitionCost?: number;
  netRevenue?: number;
  grossMargin?: number;
}

export interface TenantFinancial {
  id: string;
  name: string;
  plan: string;
  mrr: number;
  totalRevenue: number;
  users: number;
  tickets: number;
  status: string;
  joinDate: string;
  lastPayment: string;
  healthScore: number;
}

// Billing and Payment Types
export interface SLAUsage {
  id: string;
  month: string;
  plannedHours: number;
  usedHours: number;
  excessHours: number;
  status: 'within_limit' | 'warning' | 'exceeded';
  costPerExcessHour: number;
  totalExcessCost: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
  paymentMethod?: string;
  paidAt?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer';
  last4: string;
  brand: string;
  isDefault: boolean;
}

// Subscription and Payment Management
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripePriceId: text("stripe_price_id"),
  status: text("status").notNull().default("pending"), // pending, active, past_due, canceled, unpaid
  plan: text("plan").notNull(), // freemium, pro, enterprise
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  billingCycle: text("billing_cycle").default("monthly"), // monthly, yearly
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: text("currency").default("brl"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  subscriptionId: varchar("subscription_id"),
  stripeInvoiceId: text("stripe_invoice_id").unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("brl"),
  status: text("status").notNull(), // draft, open, paid, void, uncollectible
  description: text("description"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  stripePaymentMethodId: text("stripe_payment_method_id").unique(),
  type: text("type").notNull(), // card, boleto, pix
  brand: text("brand"), // visa, mastercard, etc
  last4: text("last4"),
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  isDefault: boolean("is_default").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workflow Automation System
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: jsonb("trigger").notNull(), // { type: "ticket_created", conditions: [] }
  actions: jsonb("actions").notNull(), // [{ type: "assign_agent", params: {} }]
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1), // execution order
  metadata: jsonb("metadata"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workflowExecutions = pgTable("workflow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull(),
  tenantId: varchar("tenant_id").notNull(),
  resourceType: text("resource_type").notNull(), // ticket, user, etc
  resourceId: varchar("resource_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, success, failed, skipped
  input: jsonb("input"),
  output: jsonb("output"),
  error: text("error"),
  executedAt: timestamp("executed_at").defaultNow(),
});

// Advanced Integrations
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // slack, teams, jira, webhook
  config: jsonb("config").notNull(), // credentials, endpoints, etc
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  metadata: jsonb("metadata"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  integrationId: varchar("integration_id"),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, failed, retrying
  attempts: integer("attempts").default(0),
  nextRetryAt: timestamp("next_retry_at"),
  lastError: text("last_error"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial Analytics and Reports
export const financialMetrics = pgTable("financial_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id"),
  period: text("period").notNull(), // YYYY-MM
  mrr: decimal("mrr", { precision: 12, scale: 2 }).default("0"), // Monthly Recurring Revenue
  arr: decimal("arr", { precision: 12, scale: 2 }).default("0"), // Annual Recurring Revenue
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0"),
  churnRate: decimal("churn_rate", { precision: 5, scale: 2 }).default("0"),
  ltv: decimal("ltv", { precision: 10, scale: 2 }).default("0"), // Lifetime Value
  activeSubscriptions: integer("active_subscriptions").default(0),
  newSubscriptions: integer("new_subscriptions").default(0),
  canceledSubscriptions: integer("canceled_subscriptions").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Analytics and Insights
export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  resourceType: text("resource_type").notNull(), // ticket, customer, agent
  resourceId: varchar("resource_id"),
  insightType: text("insight_type").notNull(), // sentiment, category, prediction, suggestion
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  data: jsonb("data").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Additional Relations
export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  tenant: one(tenants, { fields: [subscriptions.tenantId], references: [tenants.id] }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  tenant: one(tenants, { fields: [invoices.tenantId], references: [tenants.id] }),
  subscription: one(subscriptions, { fields: [invoices.subscriptionId], references: [subscriptions.id] }),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  tenant: one(tenants, { fields: [workflows.tenantId], references: [tenants.id] }),
  executions: many(workflowExecutions),
  creator: one(users, { fields: [workflows.createdBy], references: [users.id] }),
}));

export const integrationsRelations = relations(integrations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [integrations.tenantId], references: [tenants.id] }),
  webhookEvents: many(webhookEvents),
  creator: one(users, { fields: [integrations.createdBy], references: [users.id] }),
}));

// Insert schemas for new tables
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
});

// Types for new entities
export type Subscription = typeof subscriptions.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type FinancialMetric = typeof financialMetrics.$inferSelect;
export type AIInsight = typeof aiInsights.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;


