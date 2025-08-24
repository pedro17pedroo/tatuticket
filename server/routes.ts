import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTenantSchema, insertTicketSchema, insertDepartmentSchema, insertTeamSchema, insertCustomerSchema, insertKnowledgeArticleSchema, insertSlaConfigSchema } from "@shared/schema";
import { z } from "zod";
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
            content: "You are an AI assistant for a ticket management system. Analyze the ticket and provide categorization, priority recommendation, and sentiment analysis. Respond with JSON in this format: { 'category': string, 'priority': 'low'|'medium'|'high'|'critical', 'sentiment': 'positive'|'neutral'|'negative', 'urgency_score': number, 'recommended_department': string, 'summary': string }"
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
