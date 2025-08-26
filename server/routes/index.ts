import { Express } from 'express';
import { createServer, type Server } from 'http';
import authRoutes from './auth.routes';
import ticketRoutes from './ticket.routes';
import userRoutes from './user.routes';
import tenantRoutes from './tenant.routes';
import paymentRoutes from './payment.routes';

export const registerRoutes = (app: Express): Server => {
  // Register all routes with /api prefix
  app.use('/api/auth', authRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tenants', tenantRoutes);
  app.use('/api/payments', paymentRoutes);

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
};