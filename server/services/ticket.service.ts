import { storage } from '../storage';
import { InsertTicket, type Ticket } from '@shared/schema';
import { AppError } from '../middlewares/error.middleware';

export class TicketService {
  static async getTickets(filters: { tenantId?: string, customerId?: string, assigneeId?: string }): Promise<Ticket[]> {
    const { tenantId, customerId, assigneeId } = filters;
    
    if (tenantId) {
      return await storage.getTicketsByTenant(tenantId);
    } else if (customerId) {
      return await storage.getTicketsByCustomer(customerId);
    } else if (assigneeId) {
      return await storage.getTicketsByAssignee(assigneeId);
    }
    
    throw new AppError('Missing query parameter: tenantId, customerId, or assigneeId required', 400);
  }

  static async createTicket(ticketData: InsertTicket, ipAddress?: string, userAgent?: string): Promise<Ticket> {
    const ticket = await storage.createTicket(ticketData);
    
    await storage.createAuditLog({
      userId: ticketData.customerId || null,
      tenantId: ticketData.tenantId,
      action: "ticket_created",
      resourceType: "ticket",
      resourceId: ticket.id,
      metadata: { subject: ticket.subject, priority: ticket.priority },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
    
    return ticket;
  }

  static async getTicketById(id: string): Promise<Ticket> {
    const ticket = await storage.getTicket(id);
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }
    return ticket;
  }

  static async updateTicket(id: string, updates: Partial<Ticket>, ipAddress?: string, userAgent?: string): Promise<Ticket> {
    const ticket = await storage.updateTicket(id, updates);
    
    await storage.createAuditLog({
      userId: null,
      tenantId: ticket.tenantId,
      action: "ticket_updated",
      resourceType: "ticket",
      resourceId: ticket.id,
      metadata: { updates },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
    
    return ticket;
  }

  static async getTicketStats(tenantId: string) {
    return await storage.getTicketStats(tenantId);
  }
}