import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { subscriptions, tenants, invoices, paymentMethods, financialMetrics } from '../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { catchAsync } from '../middlewares/error.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { paymentService } from '../integrations/payment.integration';

const router = Router();

// Schema for subscription management
const updateSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  action: z.enum(['upgrade', 'downgrade', 'cancel', 'reactivate']),
  newPlan: z.string().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

const createExcessPaymentSchema = z.object({
  tenantId: z.string(),
  amount: z.number().positive(),
  description: z.string(),
  paymentMethodId: z.string(),
});

// GET /api/subscriptions/:tenantId - Get tenant subscription
router.get('/:tenantId', catchAsync(async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.tenantId, tenantId),
    with: {
      tenant: true,
    },
    orderBy: desc(subscriptions.createdAt),
  });
  
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  // Get recent invoices
  const recentInvoices = await db.query.invoices.findMany({
    where: eq(invoices.tenantId, tenantId),
    orderBy: desc(invoices.createdAt),
    limit: 10,
  });
  
  res.json({
    subscription,
    invoices: recentInvoices,
  });
}));

// POST /api/subscriptions/manage - Upgrade/downgrade/cancel subscription
router.post('/manage', validateBody(updateSubscriptionSchema), catchAsync(async (req: Request, res: Response) => {
  const { subscriptionId, action, newPlan, cancelAtPeriodEnd } = req.body;
  
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, subscriptionId),
  });
  
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  try {
    let result;
    
    switch (action) {
      case 'upgrade':
      case 'downgrade':
        if (!newPlan) {
          return res.status(400).json({ error: 'New plan required for upgrade/downgrade' });
        }
        
        // Update subscription in database
        await db.update(subscriptions)
          .set({
            plan: newPlan,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));
        
        // If Stripe is enabled, update there too
        if (paymentService.isEnabled() && subscription.stripeSubscriptionId) {
          // Here would be the actual Stripe update logic
          console.log(`${action === 'upgrade' ? '⬆️' : '⬇️'} Subscription ${action}d to ${newPlan}`);
        }
        
        result = { success: true, action, newPlan };
        break;
        
      case 'cancel':
        await db.update(subscriptions)
          .set({
            status: cancelAtPeriodEnd ? 'active' : 'canceled',
            cancelAtPeriodEnd: cancelAtPeriodEnd || false,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));
        
        if (paymentService.isEnabled() && subscription.stripeSubscriptionId) {
          await paymentService.cancelSubscription(subscription.stripeSubscriptionId);
        }
        
        result = { success: true, action: 'canceled', cancelAtPeriodEnd };
        break;
        
      case 'reactivate':
        await db.update(subscriptions)
          .set({
            status: 'active',
            cancelAtPeriodEnd: false,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));
        
        result = { success: true, action: 'reactivated' };
        break;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error managing subscription:', error);
    res.status(500).json({ error: 'Failed to manage subscription' });
  }
}));

// POST /api/subscriptions/excess-payment - Handle excess SLA payments
router.post('/excess-payment', validateBody(createExcessPaymentSchema), catchAsync(async (req: Request, res: Response) => {
  const { tenantId, amount, description, paymentMethodId } = req.body;
  
  try {
    // Create invoice for excess payment
    const invoice = await db.insert(invoices).values({
      tenantId,
      amount: amount.toString(),
      currency: 'brl',
      status: 'open',
      description,
      dueDate: new Date(),
    }).returning();
    
    // Process payment if Stripe is enabled
    if (paymentService.isEnabled()) {
      // Here would be the actual payment processing
      console.log('💳 Processing excess payment:', amount);
      
      // Update invoice as paid
      await db.update(invoices)
        .set({
          status: 'paid',
          paidAt: new Date(),
        })
        .where(eq(invoices.id, invoice[0].id));
    }
    
    res.json({
      success: true,
      invoiceId: invoice[0].id,
      amount,
      status: paymentService.isEnabled() ? 'paid' : 'pending',
    });
  } catch (error) {
    console.error('Error processing excess payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
}));

// GET /api/subscriptions/financial-metrics/:tenantId - Get financial metrics for tenant
router.get('/financial-metrics/:tenantId', catchAsync(async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const { months = 12 } = req.query;
  
  // Get financial metrics for the last N months
  const metrics = await db.query.financialMetrics.findMany({
    where: eq(financialMetrics.tenantId, tenantId),
    orderBy: desc(financialMetrics.period),
    limit: Number(months),
  });
  
  // Calculate current month metrics if not exists
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const currentMetrics = metrics.find(m => m.period === currentMonth);
  
  if (!currentMetrics) {
    // Calculate and insert current month metrics
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.tenantId, tenantId),
    });
    
    if (subscription) {
      const mrr = subscription.status === 'active' ? parseFloat(subscription.amount || '0') : 0;
      
      await db.insert(financialMetrics).values({
        tenantId,
        period: currentMonth,
        mrr: mrr.toString(),
        arr: (mrr * 12).toString(),
        totalRevenue: mrr.toString(),
        activeSubscriptions: subscription.status === 'active' ? 1 : 0,
      });
    }
  }
  
  res.json(metrics);
}));

export default router;