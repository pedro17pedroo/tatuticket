import { Request, Response } from 'express';
import { PaymentService } from '../services';
import { catchAsync } from '../middlewares';

export class PaymentController {
  static createSubscription = catchAsync(async (req: Request, res: Response) => {
    const { email, planId, companyName, paymentMethodId } = req.body;
    const result = await PaymentService.createSubscription(
      email,
      planId,
      companyName,
      paymentMethodId,
      req.ip || undefined,
      req.get('User-Agent') || undefined
    );
    res.json(result);
  });

  static confirmSubscription = catchAsync(async (req: Request, res: Response) => {
    const { subscriptionId, tenantData } = req.body;
    const result = await PaymentService.confirmSubscription(
      subscriptionId,
      tenantData,
      req.ip || undefined,
      req.get('User-Agent') || undefined
    );
    res.json(result);
  });
}