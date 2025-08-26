import { Request, Response } from 'express';
import { TicketService } from '../services';
import { catchAsync } from '../middlewares';

export class TicketController {
  static getTickets = catchAsync(async (req: Request, res: Response) => {
    const { tenantId, customerId, assigneeId } = req.query;
    const tickets = await TicketService.getTickets({
      tenantId: tenantId as string,
      customerId: customerId as string,
      assigneeId: assigneeId as string
    });
    res.json(tickets);
  });

  static createTicket = catchAsync(async (req: Request, res: Response) => {
    const ticket = await TicketService.createTicket(
      req.body,
      req.ip || undefined,
      req.get('User-Agent') || undefined
    );
    res.status(201).json(ticket);
  });

  static getTicketById = catchAsync(async (req: Request, res: Response) => {
    const ticket = await TicketService.getTicketById(req.params.id);
    res.json(ticket);
  });

  static updateTicket = catchAsync(async (req: Request, res: Response) => {
    const ticket = await TicketService.updateTicket(
      req.params.id,
      req.body,
      req.ip || undefined,
      req.get('User-Agent') || undefined
    );
    res.json(ticket);
  });

  static getTicketStats = catchAsync(async (req: Request, res: Response) => {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId is required' });
    }
    const stats = await TicketService.getTicketStats(tenantId as string);
    res.json(stats);
  });
}