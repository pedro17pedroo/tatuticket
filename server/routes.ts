import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { insertUserSchema, insertTenantSchema, insertTicketSchema, insertDepartmentSchema, insertTeamSchema, insertCustomerSchema, insertKnowledgeArticleSchema, insertSlaConfigSchema, insertOtpCodeSchema, users } from "@shared/schema";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import OpenAI from "openai";
import Stripe from "stripe";

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null;

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        tenantId: user.tenantId,
        action: "user_registered",
        resourceType: "user",
        resourceId: user.id,
        metadata: { email: user.email },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.status(201).json({ user: { id: user.id, email: user.email, username: user.username } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        // Create failed login audit log
        await storage.createAuditLog({
          userId: null,
          tenantId: user?.tenantId || null,
          action: "login_failed",
          resourceType: "user",
          resourceId: user?.id || null,
          metadata: { email, reason: "invalid_credentials" },
          ipAddress: req.ip || null,
          userAgent: req.get('User-Agent') || null,
        });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is disabled" });
      }
      
      // Create successful login audit log
      await storage.createAuditLog({
        userId: user.id,
        tenantId: user.tenantId,
        action: "login_successful",
        resourceType: "user",
        resourceId: user.id,
        metadata: { email: user.email },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Demo credentials endpoint for easy testing
  app.get("/api/auth/demo-credentials", async (req, res) => {
    res.json({
      superAdmin: { email: "admin@tatuticket.com", password: "admin123", role: "super_admin" },
      empresa: { email: "empresa@test.com", password: "empresa123", role: "admin" },
      cliente: { email: "cliente@test.com", password: "cliente123", role: "user" },
      agent: { email: "maria.santos@techcorp.com", password: "agent123", role: "agent" },
      manager: { email: "ana.costa@techcorp.com", password: "manager123", role: "manager" }
    });
  });

  // OTP routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email, type = "email_verification" } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiration time (5 minutes from now)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      
      // Save OTP to database
      await storage.createOtpCode({
        email,
        code,
        type,
        expiresAt
      });
      
      // In production, this would send an actual email
      // For demo purposes, we'll log it and return success
      console.log(`OTP for ${email}: ${code} (expires at ${expiresAt})`);
      
      await storage.createAuditLog({
        userId: null,
        tenantId: null,
        action: "otp_sent",
        resourceType: "otp",
        resourceId: null,
        metadata: { email, type },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.json({ 
        message: "OTP sent successfully",
        // In demo mode, return the code for testing
        ...(process.env.NODE_ENV === "development" && { otpCode: code })
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code, type = "email_verification" } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required" });
      }
      
      // Verify OTP
      const otpRecord = await storage.verifyOtpCode(email, code, type);
      
      if (!otpRecord) {
        await storage.createAuditLog({
          userId: null,
          tenantId: null,
          action: "otp_verification_failed",
          resourceType: "otp",
          resourceId: null,
          metadata: { email, type, reason: "invalid_or_expired" },
          ipAddress: req.ip || null,
          userAgent: req.get('User-Agent') || null,
        });
        
        return res.status(400).json({ message: "Invalid or expired OTP code" });
      }
      
      // Check attempt limit
      if ((otpRecord.attempts || 0) >= 3) {
        return res.status(400).json({ message: "Too many attempts. Please request a new OTP." });
      }
      
      // Mark OTP as used
      await storage.markOtpAsUsed(otpRecord.id);
      
      await storage.createAuditLog({
        userId: null,
        tenantId: null,
        action: "otp_verified",
        resourceType: "otp",
        resourceId: otpRecord.id,
        metadata: { email, type },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.json({ message: "OTP verified successfully", verified: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tenant routes
  app.get("/api/tenants", async (req, res) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tenants", async (req, res) => {
    try {
      const tenantData = insertTenantSchema.parse(req.body);
      const tenant = await storage.createTenant(tenantData);
      
      await storage.createAuditLog({
        userId: null,
        tenantId: tenant.id,
        action: "tenant_created",
        resourceType: "tenant",
        resourceId: tenant.id,
        metadata: { name: tenant.name, plan: tenant.plan },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.status(201).json(tenant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tenants/:id", async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.params.id);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/tenants/:id", async (req, res) => {
    try {
      const updates = req.body;
      const tenant = await storage.updateTenant(req.params.id, updates);
      res.json(tenant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Ticket routes
  app.get("/api/tickets", async (req, res) => {
    try {
      const { tenantId, customerId, assigneeId } = req.query;
      
      let tickets;
      if (tenantId) {
        tickets = await storage.getTicketsByTenant(tenantId as string);
      } else if (customerId) {
        tickets = await storage.getTicketsByCustomer(customerId as string);
      } else if (assigneeId) {
        tickets = await storage.getTicketsByAssignee(assigneeId as string);
      } else {
        return res.status(400).json({ message: "Missing query parameter" });
      }
      
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tickets", async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(ticketData);
      
      await storage.createAuditLog({
        userId: ticketData.customerId || null,
        tenantId: ticketData.tenantId,
        action: "ticket_created",
        resourceType: "ticket",
        resourceId: ticket.id,
        metadata: { subject: ticket.subject, priority: ticket.priority },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tickets/:id", async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/tickets/:id", async (req, res) => {
    try {
      const updates = req.body;
      const ticket = await storage.updateTicket(req.params.id, updates);
      
      await storage.createAuditLog({
        userId: null,
        tenantId: ticket.tenantId,
        action: "ticket_updated",
        resourceType: "ticket",
        resourceId: ticket.id,
        metadata: { updates },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.json(ticket);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Department routes
  app.get("/api/departments", async (req, res) => {
    try {
      const { tenantId } = req.query;
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      const departments = await storage.getDepartmentsByTenant(tenantId as string);
      res.json(departments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/departments", async (req, res) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(departmentData);
      res.status(201).json(department);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Team routes
  app.get("/api/teams", async (req, res) => {
    try {
      const { tenantId, departmentId } = req.query;
      
      let teams;
      if (departmentId) {
        teams = await storage.getTeamsByDepartment(departmentId as string);
      } else if (tenantId) {
        teams = await storage.getTeamsByTenant(tenantId as string);
      } else {
        return res.status(400).json({ message: "tenantId or departmentId is required" });
      }
      
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const { tenantId } = req.query;
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      const customers = await storage.getCustomersByTenant(tenantId as string);
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const { tenantId, role } = req.query;
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      
      // Get all users for the tenant
      const users = await storage.getUsersByTenant(tenantId as string);
      
      // Filter by role if specified
      let filteredUsers = users;
      if (role) {
        const roles = (role as string).split(',');
        filteredUsers = users.filter(user => roles.includes(user.role));
      }
      
      res.json(filteredUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userResponse } = user;
      
      await storage.createAuditLog({
        userId: null,
        tenantId: userData.tenantId || null,
        action: "user_created",
        resourceType: "user",
        resourceId: user.id,
        metadata: { username: user.username, role: user.role },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.status(201).json(userResponse);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      
      // If password is empty, remove it from updates
      if (updates.password === "") {
        delete updates.password;
      }
      
      const user = await storage.updateUser(req.params.id, updates);
      
      // Don't return password
      const { password, ...userResponse } = user;
      
      await storage.createAuditLog({
        userId: req.params.id,
        tenantId: user.tenantId,
        action: "user_updated",
        resourceType: "user", 
        resourceId: user.id,
        metadata: { updates: Object.keys(updates) },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.json(userResponse);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Knowledge base routes
  app.get("/api/knowledge-articles", async (req, res) => {
    try {
      const { tenantId } = req.query;
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      const articles = await storage.getKnowledgeArticlesByTenant(tenantId as string);
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/knowledge-articles", async (req, res) => {
    try {
      const articleData = insertKnowledgeArticleSchema.parse(req.body);
      const article = await storage.createKnowledgeArticle(articleData);
      res.status(201).json(article);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/knowledge-articles/:id", async (req, res) => {
    try {
      const article = await storage.getKnowledgeArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/knowledge-articles/:id", async (req, res) => {
    try {
      const updates = req.body;
      const article = await storage.updateKnowledgeArticle(req.params.id, updates);
      res.json(article);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/knowledge-articles/:id", async (req, res) => {
    try {
      await storage.deleteKnowledgeArticle(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/knowledge-articles/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const article = await storage.updateKnowledgeArticleStatus(req.params.id, status);
      res.json(article);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/knowledge-articles/:id/view", async (req, res) => {
    try {
      await storage.incrementKnowledgeArticleViews(req.params.id);
      res.status(200).json({ message: "View count incremented" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // SLA routes
  app.get("/api/sla-configs", async (req, res) => {
    try {
      const { tenantId } = req.query;
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      const slaConfigs = await storage.getSlaConfigsByTenant(tenantId as string);
      res.json(slaConfigs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sla-configs", async (req, res) => {
    try {
      const slaData = insertSlaConfigSchema.parse(req.body);
      const slaConfig = await storage.createSlaConfig(slaData);
      res.status(201).json(slaConfig);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Analytics routes
  app.get("/api/analytics/ticket-stats", async (req, res) => {
    try {
      const { tenantId } = req.query;
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      const stats = await storage.getTicketStats(tenantId as string);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analytics/global-stats", async (req, res) => {
    try {
      const stats = await storage.getTenantStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Audit logs
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const { tenantId } = req.query;
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      const logs = await storage.getAuditLogsByTenant(tenantId as string);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const { tenantId } = req.query;
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      const users = await storage.getUsersByTenant(tenantId as string);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI-powered ticket analysis
  app.post("/api/ai/analyze-ticket", async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ message: "AI service not available" });
      }

      const { subject, description } = req.body;
      
      if (!subject || !description) {
        return res.status(400).json({ message: "Subject and description are required" });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant for a ticket management system. Analyze the ticket and provide categorization, priority recommendation, sentiment analysis, and predictions. Respond with JSON in this format: { 'category': string, 'priority': 'low'|'medium'|'high'|'critical', 'sentiment': 'positive'|'neutral'|'negative', 'sentiment_score': number, 'urgency_score': number, 'recommended_department': string, 'summary': string, 'predicted_resolution_time': number, 'escalation_risk': 'low'|'medium'|'high', 'suggested_actions': string[] }"
          },
          {
            role: "user",
            content: `Analyze this ticket:\nSubject: ${subject}\nDescription: ${description}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content!);
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ message: "AI analysis failed: " + error.message });
    }
  });

  // Enhanced ticket creation with AI analysis
  app.post("/api/tickets/enhanced", async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      
      // Get AI analysis if available
      let aiAnalysis = null;
      if (openai && ticketData.subject && ticketData.description) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "Analyze this support ticket and provide categorization and priority. Respond with JSON: { 'category': string, 'priority': 'low'|'medium'|'high'|'critical', 'urgency_score': number }"
              },
              {
                role: "user",
                content: `Subject: ${ticketData.subject}\nDescription: ${ticketData.description}`
              }
            ],
            response_format: { type: "json_object" },
          });
          aiAnalysis = JSON.parse(response.choices[0].message.content!);
        } catch (aiError) {
          console.log("AI analysis failed, proceeding without it:", aiError);
        }
      }

      // Apply AI recommendations if available
      if (aiAnalysis) {
        ticketData.category = aiAnalysis.category || ticketData.category;
        ticketData.priority = aiAnalysis.priority || ticketData.priority;
      }

      const ticket = await storage.createTicket(ticketData);
      
      await storage.createAuditLog({
        userId: ticketData.customerId || null,
        tenantId: ticketData.tenantId,
        action: "ticket_created_enhanced",
        resourceType: "ticket",
        resourceId: ticket.id,
        metadata: { 
          subject: ticket.subject, 
          priority: ticket.priority,
          aiAnalysis: aiAnalysis || "not_available"
        },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.status(201).json({ ticket, aiAnalysis });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // AI Insights and Predictions
  app.get("/api/ai/insights", async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ message: "AI service not available" });
      }

      const { tenantId } = req.query;
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }

      // Get recent tickets for analysis
      const tickets = await storage.getTicketsByTenant(tenantId as string);
      const recentTickets = tickets.slice(0, 50); // Last 50 tickets

      if (recentTickets.length === 0) {
        return res.json({ insights: [], trends: [], recommendations: [] });
      }

      // Prepare data for AI analysis
      const ticketSummary = recentTickets.map(t => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        category: t.category,
        created: t.createdAt,
        resolved: t.resolvedAt
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI analyst for a ticket management system. Analyze the ticket data and provide insights, trends, and recommendations. Respond with JSON: { 'insights': string[], 'trends': [{ 'type': string, 'description': string, 'impact': 'positive'|'negative'|'neutral' }], 'recommendations': [{ 'priority': 'high'|'medium'|'low', 'action': string, 'rationale': string }], 'performance_score': number, 'predictions': [{ 'metric': string, 'prediction': string, 'confidence': number }] }"
          },
          {
            role: "user",
            content: `Analyze these ticket patterns:\n${JSON.stringify(ticketSummary, null, 2)}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const insights = JSON.parse(response.choices[0].message.content!);
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ message: "AI insights failed: " + error.message });
    }
  });

  // Real-time sentiment analysis
  app.post("/api/ai/sentiment", async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ message: "AI service not available" });
      }

      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Analyze the sentiment of the given text. Respond with JSON: { 'sentiment': 'positive'|'neutral'|'negative', 'confidence': number, 'emotional_indicators': string[], 'urgency_level': 'low'|'medium'|'high', 'recommended_response_tone': string }"
          },
          {
            role: "user",
            content: `Analyze sentiment: ${text}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const sentiment = JSON.parse(response.choices[0].message.content!);
      res.json(sentiment);
    } catch (error: any) {
      res.status(500).json({ message: "Sentiment analysis failed: " + error.message });
    }
  });

  // Escalation risk assessment
  app.post("/api/ai/escalation-risk", async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ message: "AI service not available" });
      }

      const { ticketId } = req.body;
      if (!ticketId) {
        return res.status(400).json({ message: "ticketId is required" });
      }

      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Calculate time since creation
      const hoursSinceCreation = Math.floor((Date.now() - new Date(ticket.createdAt!).getTime()) / (1000 * 60 * 60));
      const slaBreached = ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date();

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Assess escalation risk for a support ticket. Respond with JSON: { 'risk_level': 'low'|'medium'|'high'|'critical', 'risk_factors': string[], 'recommended_actions': string[], 'escalation_probability': number, 'time_to_escalation': number }"
          },
          {
            role: "user",
            content: `Assess ticket: Subject: ${ticket.subject}, Priority: ${ticket.priority}, Status: ${ticket.status}, Hours since creation: ${hoursSinceCreation}, SLA breached: ${slaBreached}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const riskAssessment = JSON.parse(response.choices[0].message.content!);
      res.json(riskAssessment);
    } catch (error: any) {
      res.status(500).json({ message: "Escalation risk assessment failed: " + error.message });
    }
  });

  // Admin Routes - Global Management
  app.get("/api/admin/users", async (req, res) => {
    try {
      // Check if user has admin privileges
      // For now, assume any logged in user has access, in production add proper auth
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      
      // Don't return passwords
      const safeUsers = allUsers.map(({ password, ...user }: any) => user);
      
      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Don't return password
      const { password, ...userResponse } = user;
      
      await storage.createAuditLog({
        userId: null,
        tenantId: userData.tenantId || null,
        action: "admin_user_created",
        resourceType: "user",
        resourceId: user.id,
        metadata: { username: user.username, role: user.role },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.status(201).json(userResponse);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      
      // If password is empty, remove it from updates
      if (updates.password === "") {
        delete updates.password;
      }
      
      const user = await storage.updateUser(req.params.id, updates);
      
      // Don't return password
      const { password, ...userResponse } = user;
      
      await storage.createAuditLog({
        userId: req.params.id,
        tenantId: user.tenantId,
        action: "admin_user_updated",
        resourceType: "user", 
        resourceId: user.id,
        metadata: { updates: Object.keys(updates) },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.json(userResponse);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      await db.delete(users).where(eq(users.id, req.params.id));
      
      await storage.createAuditLog({
        userId: null,
        tenantId: null,
        action: "admin_user_deleted",
        resourceType: "user",
        resourceId: req.params.id,
        metadata: {},
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/tenants", async (req, res) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe payment integration
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment service not available" });
      }

      const { amount, currency = "brl" } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          integration_check: "accept_a_payment",
        },
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Knowledge base search with AI
  app.get("/api/knowledge-articles/search", async (req, res) => {
    try {
      const { tenantId, query } = req.query;
      
      if (!tenantId || !query) {
        return res.status(400).json({ message: "tenantId and query are required" });
      }

      // Get all articles for the tenant
      const articles = await storage.getKnowledgeArticlesByTenant(tenantId as string);
      
      // Simple text search (in production, use proper search like Elasticsearch)
      const searchTerm = (query as string).toLowerCase();
      const filteredArticles = articles.filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.content.toLowerCase().includes(searchTerm)
      );

      // AI-powered relevance scoring if OpenAI is available
      if (openai && filteredArticles.length > 0) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are helping to rank knowledge base articles by relevance to a user query. Respond with JSON: { 'rankings': [{ 'id': string, 'relevance_score': number }] }"
              },
              {
                role: "user",
                content: `Query: "${query}"\n\nArticles to rank:\n${filteredArticles.map(a => `ID: ${a.id}, Title: ${a.title}`).join('\n')}`
              }
            ],
            response_format: { type: "json_object" },
          });
          
          const rankings = JSON.parse(response.choices[0].message.content!);
          // Sort articles by AI relevance score
          if (rankings.rankings) {
            const scoreMap = new Map(rankings.rankings.map((r: any) => [r.id, r.relevance_score]));
            filteredArticles.sort((a, b) => {
              const scoreA = Number(scoreMap.get(a.id)) || 0;
              const scoreB = Number(scoreMap.get(b.id)) || 0;
              return scoreB - scoreA;
            });
          }
        } catch (aiError) {
          console.log("AI ranking failed, using basic search:", aiError);
        }
      }

      res.json(filteredArticles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Advanced analytics endpoint
  app.get("/api/analytics/advanced", async (req, res) => {
    try {
      const { tenantId, period = "30d" } = req.query;
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }

      // Get basic stats
      const ticketStats = await storage.getTicketStats(tenantId as string);
      const tickets = await storage.getTicketsByTenant(tenantId as string);
      
      // Calculate advanced metrics
      const now = new Date();
      const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      
      const recentTickets = tickets.filter(t => new Date(t.createdAt!) > periodStart);
      
      const analytics = {
        ...ticketStats,
        period,
        trends: {
          totalTickets: recentTickets.length,
          avgResponseTime: recentTickets.reduce((acc, t) => {
            const created = new Date(t.createdAt!);
            const updated = new Date(t.updatedAt!);
            const timeDiff = updated.getTime() - created.getTime();
            return acc + (timeDiff / (1000 * 60 * 60)); // hours
          }, 0) / Math.max(recentTickets.length, 1),
          priorityDistribution: {
            critical: recentTickets.filter(t => t.priority === "critical").length,
            high: recentTickets.filter(t => t.priority === "high").length,
            medium: recentTickets.filter(t => t.priority === "medium").length,
            low: recentTickets.filter(t => t.priority === "low").length,
          },
          statusDistribution: {
            open: recentTickets.filter(t => t.status === "open").length,
            in_progress: recentTickets.filter(t => t.status === "in_progress").length,
            resolved: recentTickets.filter(t => t.status === "resolved").length,
            closed: recentTickets.filter(t => t.status === "closed").length,
          }
        }
      };

      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
