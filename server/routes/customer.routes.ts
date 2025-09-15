import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { catchAsync } from '../middlewares';
import { AuthRequest } from '../types/auth.types.js';

const router = Router();

// Validation schemas
const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().optional()
});

const payInvoiceSchema = z.object({
  paymentMethodId: z.string()
});

/**
 * @swagger
 * /api/customer/invoices:
 *   get:
 *     summary: Get customer invoices
 *     description: Retrieve all invoices for the authenticated customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customer invoices
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
 *                       number:
 *                         type: string
 *                       date:
 *                         type: string
 *                       dueDate:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [paid, pending, overdue, cancelled]
 *                       description:
 *                         type: string
 */
router.get('/invoices', authenticateToken, catchAsync(async (req: AuthRequest, res: Response) => {
  try {
    // In real implementation, fetch from database based on req.user.tenantId
    const mockInvoices = [
      {
        id: 'inv_001',
        number: 'INV-2025-001',
        date: '2025-01-15',
        dueDate: '2025-02-14',
        amount: 299.99,
        currency: 'AOA',
        status: 'paid',
        description: 'Plano Professional - Janeiro 2025',
        items: [
          {
            id: 'item_1',
            description: 'Plano Professional (mensal)',
            quantity: 1,
            unitPrice: 299.99,
            total: 299.99,
            type: 'plan'
          }
        ]
      },
      {
        id: 'inv_002',
        number: 'INV-2025-002',
        date: '2025-01-20',
        dueDate: '2025-02-19',
        amount: 45.50,
        currency: 'AOA',
        status: 'pending',
        description: 'Horas SLA excedentes - Janeiro 2025',
        items: [
          {
            id: 'item_2',
            description: 'Horas SLA excedentes',
            quantity: 7,
            unitPrice: 6.50,
            total: 45.50,
            type: 'overage'
          }
        ]
      },
      {
        id: 'inv_003',
        number: 'INV-2024-012',
        date: '2024-12-15',
        dueDate: '2025-01-14',
        amount: 299.99,
        currency: 'AOA',
        status: 'overdue',
        description: 'Plano Professional - Dezembro 2024',
        items: [
          {
            id: 'item_3',
            description: 'Plano Professional (mensal)',
            quantity: 1,
            unitPrice: 299.99,
            total: 299.99,
            type: 'plan'
          }
        ]
      }
    ];

    res.json({
      success: true,
      data: mockInvoices,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices'
    });
  }
}));

/**
 * @swagger
 * /api/customer/invoices/{invoiceId}/pay:
 *   post:
 *     summary: Pay an invoice
 *     description: Process payment for a specific invoice
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     paidAt:
 *                       type: string
 */
router.post('/invoices/:invoiceId/pay', authenticateToken, catchAsync(async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceId } = req.params;
    
    // Mock payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In real implementation:
    // 1. Verify invoice belongs to customer
    // 2. Process payment with Stripe
    // 3. Update invoice status in database
    // 4. Send confirmation email
    
    const paymentResult = {
      paymentId: `pay_${Date.now()}`,
      invoiceId,
      status: 'paid',
      paidAt: new Date().toISOString(),
      amount: 299.99,
      currency: 'BRL'
    };

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: paymentResult
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment'
    });
  }
}));

/**
 * @swagger
 * /api/customer/usage-billing:
 *   get:
 *     summary: Get usage billing information
 *     description: Retrieve current usage and billing information for the customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage billing information
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
 *                     usage:
 *                       type: object
 *                     charges:
 *                       type: array
 */
router.get('/usage-billing', authenticateToken, catchAsync(async (req: AuthRequest, res: Response) => {
  try {
    // Mock usage billing data
    const usageBilling = {
      currentPeriod: {
        start: '2025-01-01',
        end: '2025-01-31',
        daysRemaining: 11
      },
      plan: {
        name: 'Professional',
        monthlyFee: 299.99,
        limits: {
          tickets: 1000,
          agents: 25,
          storage: 50, // GB
          slaHours: 160
        }
      },
      usage: {
        tickets: 450,
        agents: 12,
        storage: 23.5,
        slaHours: 165 // Exceeded by 5 hours
      },
      charges: [
        {
          id: 'charge_001',
          description: 'Horas SLA excedentes (5 horas)',
          quantity: 5,
          unitPrice: 6.50,
          total: 32.50,
          date: '2025-01-20'
        }
      ],
      totalExcess: 32.50,
      nextBilling: '2025-02-01'
    };

    res.json({
      success: true,
      data: usageBilling,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching usage billing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage billing information'
    });
  }
}));

/**
 * @swagger
 * /api/customer/payment-methods:
 *   get:
 *     summary: Get customer payment methods
 *     description: Retrieve saved payment methods for the customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment methods
 */
router.get('/payment-methods', authenticateToken, catchAsync(async (req: AuthRequest, res: Response) => {
  try {
    // Mock payment methods
    const paymentMethods = [
      {
        id: 'pm_001',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2027
        },
        isDefault: true,
        createdAt: '2024-12-01T10:00:00Z'
      },
      {
        id: 'pm_002',
        type: 'card',
        card: {
          brand: 'mastercard',
          last4: '5555',
          expMonth: 8,
          expYear: 2026
        },
        isDefault: false,
        createdAt: '2024-11-15T14:30:00Z'
      }
    ];

    res.json({
      success: true,
      data: paymentMethods,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods'
    });
  }
}));

/**
 * @swagger
 * /api/customer/dashboard-stats:
 *   get:
 *     summary: Get customer dashboard statistics
 *     description: Retrieve key metrics and statistics for the customer dashboard
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard-stats', authenticateToken, catchAsync(async (req: AuthRequest, res: Response) => {
  try {
    // Mock dashboard stats
    const dashboardStats = {
      tickets: {
        total: 45,
        open: 12,
        inProgress: 8,
        resolved: 25,
        avgResponseTime: '2.3 horas'
      },
      sla: {
        compliance: 94.5,
        breaches: 3,
        hoursUsed: 165,
        hoursLimit: 160
      },
      billing: {
        currentMonthCharges: 332.49,
        nextBillingDate: '2025-02-01',
        paymentStatus: 'current'
      },
      satisfaction: {
        rating: 4.7,
        responses: 28,
        trend: 'up'
      }
    };

    res.json({
      success: true,
      data: dashboardStats,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
}));

export default router;