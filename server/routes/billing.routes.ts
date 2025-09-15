import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { catchAsync } from '../middlewares';
import { AuthRequest } from '../types/auth.types.js';
import Stripe from 'stripe';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-07-30.basil',
});

// Validation schemas
const createUsageBillingSchema = z.object({
  customerId: z.string(),
  usageType: z.enum(['sla_hours', 'api_calls', 'storage']),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  description: z.string()
});

const payExcessInvoiceSchema = z.object({
  invoiceId: z.string(),
  paymentMethodId: z.string()
});

/**
 * @swagger
 * /api/billing/sla-usage:
 *   get:
 *     summary: Get SLA usage data
 *     description: Retrieve SLA usage statistics for billing purposes
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [current, last_3, last_6, year]
 *         description: Time period for usage data
 *     responses:
 *       200:
 *         description: SLA usage data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: 
 *                         type: string
 *                       month:
 *                         type: string
 *                       plannedHours:
 *                         type: number
 *                       usedHours:
 *                         type: number
 *                       excessHours:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [within_limit, exceeded, warning]
 *                       costPerExcessHour:
 *                         type: number
 *                       totalExcessCost:
 *                         type: number
 */
router.get('/sla-usage', 
  authenticateToken,
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { period = 'current' } = req.query;
    
    // Mock SLA usage data - In production, this would query the database
    const slaUsageData = [
      {
        id: '1',
        month: '2025-01',
        plannedHours: 40,
        usedHours: 52,
        excessHours: 12,
        status: 'exceeded',
        costPerExcessHour: 15,
        totalExcessCost: 180
      },
      {
        id: '2',
        month: '2024-12',
        plannedHours: 40,
        usedHours: 38,
        excessHours: 0,
        status: 'within_limit',
        costPerExcessHour: 15,
        totalExcessCost: 0
      },
      {
        id: '3',
        month: '2024-11',
        plannedHours: 40,
        usedHours: 45,
        excessHours: 5,
        status: 'exceeded',
        costPerExcessHour: 15,
        totalExcessCost: 75
      }
    ];

    // Filter based on period
    let filteredData = slaUsageData;
    if (period === 'current') {
      filteredData = slaUsageData.filter(usage => usage.month === '2025-01');
    }

    res.json({
      success: true,
      data: filteredData
    });
  })
);

/**
 * @swagger
 * /api/billing/invoices:
 *   get:
 *     summary: Get billing invoices
 *     description: Retrieve customer invoices for excess usage
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       invoiceNumber:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date
 *                       dueDate:
 *                         type: string
 *                         format: date
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [paid, pending, overdue]
 *                       description:
 *                         type: string
 */
router.get('/invoices',
  authenticateToken,
  catchAsync(async (req: AuthRequest, res: Response) => {
    // Mock invoice data
    const invoicesData = [
      {
        id: '1',
        invoiceNumber: 'INV-2025-001',
        date: '2025-01-27',
        dueDate: '2025-02-10',
        amount: 180,
        status: 'pending',
        description: 'Excesso SLA - Janeiro 2025 (12 horas)'
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024-045',
        date: '2024-11-30',
        dueDate: '2024-12-15',
        amount: 75,
        status: 'paid',
        description: 'Excesso SLA - Novembro 2024 (5 horas)',
        paymentMethod: 'Cartão ****4242',
        paidAt: '2024-12-05'
      }
    ];

    res.json({
      success: true,
      data: invoicesData
    });
  })
);

/**
 * @swagger
 * /api/billing/payment-methods:
 *   get:
 *     summary: Get customer payment methods
 *     description: Retrieve saved payment methods for the customer
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [card, bank_transfer]
 *                       last4:
 *                         type: string
 *                       brand:
 *                         type: string
 *                       isDefault:
 *                         type: boolean
 */
router.get('/payment-methods',
  authenticateToken,
  catchAsync(async (req: AuthRequest, res: Response) => {
    // Mock payment methods data
    const paymentMethodsData = [
      {
        id: '1',
        type: 'card',
        last4: '4242',
        brand: 'Visa',
        isDefault: true
      }
    ];

    res.json({
      success: true,
      data: paymentMethodsData
    });
  })
);

/**
 * @swagger
 * /api/billing/create-subscription:
 *   post:
 *     summary: Create Stripe subscription
 *     description: Create a new Stripe subscription for onboarding
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *               planId:
 *                 type: string
 *               billingPeriod:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               customerInfo:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *                   companyName:
 *                     type: string
 *     responses:
 *       200:
 *         description: Subscription created successfully
 */
router.post('/create-subscription',
  validateBody(z.object({
    paymentMethodId: z.string(),
    planId: z.string(),
    billingPeriod: z.enum(['monthly', 'yearly']),
    customerInfo: z.object({
      email: z.string().email(),
      name: z.string(),
      companyName: z.string()
    })
  })),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { paymentMethodId, planId, billingPeriod, customerInfo } = req.body;
    
    // Mock Stripe customer and subscription creation
    const mockCustomerId = `cus_${Date.now()}`;
    const mockSubscriptionId = `sub_${Date.now()}`;
    
    res.json({
      success: true,
      customerId: mockCustomerId,
      subscriptionId: mockSubscriptionId,
      status: 'active'
    });
  })
);

/**
 * @swagger
 * /api/billing/pay-invoice:
 *   post:
 *     summary: Pay excess billing invoice
 *     description: Process payment for excess SLA usage invoice
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceId:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 */
router.post('/pay-invoice',
  authenticateToken,
  validateBody(payExcessInvoiceSchema),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { invoiceId, paymentMethodId } = req.body;
    
    // Mock payment processing
    console.log(`Processing payment for invoice ${invoiceId} with payment method ${paymentMethodId}`);
    
    res.json({
      success: true,
      paymentId: `pay_${Date.now()}`,
      status: 'succeeded'
    });
  })
);

/**
 * @swagger
 * /api/billing/create-usage-billing:
 *   post:
 *     summary: Create usage-based billing item
 *     description: Create a billing item for usage overages (SLA hours, API calls, etc.)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, usageType, quantity, unitPrice, description]
 *             properties:
 *               customerId:
 *                 type: string
 *               usageType:
 *                 type: string
 *                 enum: [sla_hours, api_calls, storage]
 *               quantity:
 *                 type: number
 *               unitPrice:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usage billing item created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/create-usage-billing',
  authenticateToken,
  validateBody(createUsageBillingSchema),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { customerId, usageType, quantity, unitPrice, description } = req.body;

    try {
      // Create usage billing item with Stripe
      const usageItem = {
        customer: customerId,
        currency: 'aoa',
        amount: Math.round(quantity * unitPrice * 100), // Convert to cents
        description,
        metadata: {
          usage_type: usageType,
          quantity: quantity.toString(),
          unit_price: unitPrice.toString(),
          tenant_id: req.user.tenantId
        }
      };

      // In a real implementation, you would create a Stripe invoice item
      // const invoiceItem = await stripe.invoiceItems.create(usageItem);

      res.json({
        success: true,
        message: 'Usage billing item created successfully',
        data: {
          id: `usage_${Date.now()}`,
          ...usageItem,
          amount: usageItem.amount / 100 // Convert back to currency
        }
      });
    } catch (error) {
      console.error('Error creating usage billing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create usage billing item'
      });
    }
  })
);

/**
 * @swagger
 * /api/billing/pay-invoice:
 *   post:
 *     summary: Pay an invoice
 *     description: Process payment for a pending invoice
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceId, paymentMethodId]
 *             properties:
 *               invoiceId:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice payment processed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/pay-invoice',
  authenticateToken,
  validateBody(payExcessInvoiceSchema),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { invoiceId, paymentMethodId } = req.body;

    try {
      // In a real implementation, you would:
      // 1. Retrieve the invoice from Stripe
      // 2. Attach the payment method
      // 3. Pay the invoice
      
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      res.json({
        success: true,
        message: 'Invoice paid successfully',
        data: {
          invoiceId,
          paymentMethodId,
          paidAt: new Date().toISOString(),
          status: 'paid'
        }
      });
    } catch (error) {
      console.error('Error paying invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment'
      });
    }
  })
);

/**
 * @swagger
 * /api/billing/subscription-usage:
 *   get:
 *     summary: Get subscription usage metrics
 *     description: Retrieve current subscription usage and limits
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription usage data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentPeriod:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                           format: date
 *                         end:
 *                           type: string
 *                           format: date
 *                     limits:
 *                       type: object
 *                       properties:
 *                         tickets:
 *                           type: number
 *                         agents:
 *                           type: number
 *                         storage:
 *                           type: number
 *                     usage:
 *                       type: object
 *                       properties:
 *                         tickets:
 *                           type: number
 *                         agents:
 *                           type: number
 *                         storage:
 *                           type: number
 *                     overage:
 *                       type: object
 *                       properties:
 *                         tickets:
 *                           type: number
 *                         cost:
 *                           type: number
 */
router.get('/subscription-usage',
  authenticateToken,
  catchAsync(async (req: AuthRequest, res: Response) => {
    // Mock subscription usage data
    const usageData = {
      currentPeriod: {
        start: '2025-01-01',
        end: '2025-01-31'
      },
      limits: {
        tickets: 1000,
        agents: 10,
        storage: 5000 // MB
      },
      usage: {
        tickets: 1150,
        agents: 8,
        storage: 3500
      },
      overage: {
        tickets: 150,
        cost: 75.00 // $0.50 per additional ticket
      }
    };

    res.json({
      success: true,
      data: usageData
    });
  })
);

export default router;