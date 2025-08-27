import { Express } from 'express';
import { createServer, type Server } from 'http';
import { requestLogger } from '../middlewares';
import { websocketService } from '../services/websocket.service';
import authRoutes from './auth.routes';
import ticketRoutes from './ticket.routes';
import userRoutes from './user.routes';
import tenantRoutes from './tenant.routes';
import paymentRoutes from './payment.routes';
import aiRoutes from './ai.routes';
import smsRoutes from './sms.routes';
import knowledgeRoutes from '../controllers/knowledge.controller';
import webhookRoutes from './webhook.routes';
import subscriptionRoutes from './subscription.routes';
import workflowRoutes from './workflow.routes';

export const registerRoutes = (app: Express): Server => {
  // Apply request logging middleware only to API routes
  app.use('/api', requestLogger);
  
  // Register all routes with /api prefix
  app.use('/api/auth', authRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tenants', tenantRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/sms', smsRoutes);
  app.use('/api/knowledge-articles', knowledgeRoutes);
  app.use('/api/billing', subscriptionRoutes);
  app.use('/api/workflows', workflowRoutes);
  app.use('/api/webhooks', webhookRoutes);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  websocketService.initialize(httpServer);
  
  return httpServer;
};