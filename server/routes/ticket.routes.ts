import { Router } from 'express';
import { TicketController } from '../controllers';
import { validateBody, validateQuery } from '../middlewares';
import { insertTicketSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

router.get('/', validateQuery(z.object({
  tenantId: z.string().optional(),
  customerId: z.string().optional(),
  assigneeId: z.string().optional()
}).refine(data => data.tenantId || data.customerId || data.assigneeId, {
  message: "At least one of tenantId, customerId, or assigneeId is required"
})), TicketController.getTickets);

router.post('/', validateBody(insertTicketSchema), TicketController.createTicket);

router.get('/stats', validateQuery(z.object({
  tenantId: z.string()
})), TicketController.getTicketStats);

router.get('/:id', TicketController.getTicketById);

router.put('/:id', TicketController.updateTicket);

export default router;