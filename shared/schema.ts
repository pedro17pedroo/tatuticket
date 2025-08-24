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
  status: text("status").notNull().default("draft"), // draft, published, archived
  isPublic: boolean("is_public").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
});

export const insertSlaConfigSchema = createInsertSchema(slaConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;
export type SlaConfig = typeof slaConfigs.$inferSelect;
export type InsertSlaConfig = z.infer<typeof insertSlaConfigSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
