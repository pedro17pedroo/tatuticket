import { Router } from 'express';
import { PaymentController } from '../controllers';
import { validateBody } from '../middlewares';
import { z } from 'zod';

const router = Router();

router.post('/create-subscription', validateBody(z.object({
  email: z.string().email(),
  planId: z.enum(['freemium', 'pro', 'enterprise']),
  companyName: z.string().optional(),
  paymentMethodId: z.string().optional()
})), PaymentController.createSubscription);

router.post('/confirm-subscription', validateBody(z.object({
  subscriptionId: z.string(),
  tenantData: z.object({
    name: z.string(),
    slug: z.string(),
    plan: z.string()
  })
})), PaymentController.confirmSubscription);

export default router;