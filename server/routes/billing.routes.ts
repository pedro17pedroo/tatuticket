import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { validateBody, validateQuery, catchAsync } from '../middlewares';
import { z } from 'zod';

const router = Router();

// Mock data for SLA billing
const MOCK_SLA_USAGE = {
  planLimit: 160, // 160 horas SLA por mês
  currentUsage: 187, // 187 horas usadas
  exceeded: 27, // 27 horas excedidas
  excessCost: 675, // R$ 675 em excedentes
  costPerHour: 25, // R$ 25 por hora excedida
  billingPeriod: {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31')
  }
};

const MOCK_EXCESS_BILLS = [
  {
    id: 'bill_001',
    tenantId: 'tenant_1',
    period: { start: new Date('2025-01-01'), end: new Date('2025-01-31') },
    excessHours: 27,
    totalCost: 675,
    status: 'pending',
    dueDate: new Date('2025-02-15'),
    createdAt: new Date('2025-02-01'),
    invoiceUrl: '/invoices/excess_bill_001.pdf'
  },
  {
    id: 'bill_002',
    tenantId: 'tenant_1',
    period: { start: new Date('2024-12-01'), end: new Date('2024-12-31') },
    excessHours: 15,
    totalCost: 375,
    status: 'paid',
    dueDate: new Date('2025-01-15'),
    createdAt: new Date('2025-01-01'),
    invoiceUrl: '/invoices/excess_bill_002.pdf'
  }
];

const MOCK_PAYMENT_METHODS = [
  {
    id: 'pm_001',
    type: 'card',
    last4: '4532',
    brand: 'visa',
    isDefault: true
  },
  {
    id: 'pm_002',
    type: 'boleto',
    isDefault: false
  }
];

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif_001',
    type: 'sla_exceeded',
    title: 'Limite de SLA Excedido',
    message: 'Você excedeu seu limite mensal de SLA em 27 horas.',
    excessHours: 27,
    excessCost: 675,
    createdAt: new Date('2025-01-31'),
    read: false
  },
  {
    id: 'notif_002',
    type: 'payment_reminder',
    title: 'Lembrete de Pagamento',
    message: 'Fatura de excedente vencendo em 5 dias.',
    billId: 'bill_001',
    dueDate: new Date('2025-02-15'),
    createdAt: new Date('2025-02-10'),
    read: false
  }
];

// Schemas
const payExcessBillSchema = z.object({
  billId: z.string(),
  paymentMethodId: z.string(),
  tenantId: z.string().optional()
});

const createPaymentMethodSchema = z.object({
  type: z.enum(['card', 'boleto', 'pix']),
  cardToken: z.string().optional(),
  makeDefault: z.boolean().default(false)
});

const slaUsageQuerySchema = z.object({
  tenantId: z.string(),
  month: z.string().optional(), // YYYY-MM format
  year: z.string().optional()
});

/**
 * @swagger
 * /billing/sla-usage:
 *   get:
 *     summary: Get SLA usage and excess billing information
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Month in YYYY-MM format
 *     responses:
 *       200:
 *         description: SLA usage information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 planLimit:
 *                   type: number
 *                   description: Monthly SLA hours limit
 *                 currentUsage:
 *                   type: number
 *                   description: Current hours used
 *                 exceeded:
 *                   type: number
 *                   description: Hours exceeded beyond limit
 *                 excessCost:
 *                   type: number
 *                   description: Cost of excess hours
 *                 costPerHour:
 *                   type: number
 *                   description: Cost per excess hour
 *                 billingPeriod:
 *                   type: object
 *                   properties:
 *                     start:
 *                       type: string
 *                       format: date-time
 *                     end:
 *                       type: string
 *                       format: date-time
 */
router.get('/sla-usage', authenticateToken, validateQuery(slaUsageQuerySchema), catchAsync(async (req: AuthRequest, res: Response) => {
  const { tenantId, month, year } = req.query;
  
  // In a real implementation, this would query the database for actual SLA usage
  // based on tickets, their time spent, and the billing period
  
  res.json(MOCK_SLA_USAGE);
}));

/**
 * @swagger
 * /billing/excess-bills:
 *   get:
 *     summary: Get excess billing statements
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, overdue]
 *         description: Filter by bill status
 *     responses:
 *       200:
 *         description: List of excess bills
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   period:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         format: date-time
 *                       end:
 *                         type: string
 *                         format: date-time
 *                   excessHours:
 *                     type: number
 *                   totalCost:
 *                     type: number
 *                   status:
 *                     type: string
 *                     enum: [pending, paid, overdue]
 *                   dueDate:
 *                     type: string
 *                     format: date-time
 *                   invoiceUrl:
 *                     type: string
 */
router.get('/excess-bills', authenticateToken, validateQuery(z.object({
  tenantId: z.string(),
  status: z.enum(['pending', 'paid', 'overdue']).optional()
})), catchAsync(async (req: AuthRequest, res: Response) => {
  const { tenantId, status } = req.query;
  
  let bills = MOCK_EXCESS_BILLS.filter(bill => bill.tenantId === tenantId);
  
  if (status) {
    bills = bills.filter(bill => bill.status === status);
  }
  
  res.json(bills);
}));

/**
 * @swagger
 * /billing/payment-methods:
 *   get:
 *     summary: Get available payment methods
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [card, boleto, pix]
 *                   last4:
 *                     type: string
 *                   brand:
 *                     type: string
 *                   isDefault:
 *                     type: boolean
 */
router.get('/payment-methods', authenticateToken, catchAsync(async (req: AuthRequest, res: Response) => {
  res.json(MOCK_PAYMENT_METHODS);
}));

/**
 * @swagger
 * /billing/pay-excess:
 *   post:
 *     summary: Pay an excess billing statement
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [billId, paymentMethodId]
 *             properties:
 *               billId:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *               tenantId:
 *                 type: string
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
 *                 transactionId:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: Payment failed
 */
router.post('/pay-excess', authenticateToken, validateBody(payExcessBillSchema), catchAsync(async (req: AuthRequest, res: Response) => {
  const { billId, paymentMethodId, tenantId } = req.body;
  
  // Find the bill
  const bill = MOCK_EXCESS_BILLS.find(b => b.id === billId);
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found' });
  }
  
  if (bill.status !== 'pending') {
    return res.status(400).json({ error: 'Bill is not payable' });
  }
  
  // Find payment method
  const paymentMethod = MOCK_PAYMENT_METHODS.find(pm => pm.id === paymentMethodId);
  if (!paymentMethod) {
    return res.status(404).json({ error: 'Payment method not found' });
  }
  
  // Process payment (mock)
  try {
    // In real implementation:
    // 1. Process payment with Stripe/payment provider
    // 2. Update bill status in database
    // 3. Send confirmation email
    // 4. Create payment record
    
    const transactionId = `txn_${Date.now()}`;
    
    // Mock payment success
    bill.status = 'paid';
    
    res.json({
      success: true,
      transactionId,
      status: 'completed',
      message: 'Payment processed successfully'
    });
    
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Payment processing failed' 
    });
  }
}));

/**
 * @swagger
 * /billing/payment-methods:
 *   post:
 *     summary: Add a new payment method
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [card, boleto, pix]
 *               cardToken:
 *                 type: string
 *               makeDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Payment method created
 *       400:
 *         description: Invalid payment method data
 */
router.post('/payment-methods', authenticateToken, validateBody(createPaymentMethodSchema), catchAsync(async (req: AuthRequest, res: Response) => {
  const { type, cardToken, makeDefault } = req.body;
  
  // In real implementation:
  // 1. Validate card token with Stripe
  // 2. Store payment method securely
  // 3. Update default if specified
  
  const newPaymentMethod: any = {
    id: `pm_${Date.now()}`,
    type,
    ...(type === 'card' && { last4: '4242', brand: 'visa' }),
    isDefault: makeDefault || MOCK_PAYMENT_METHODS.length === 0
  };
  
  if (makeDefault) {
    MOCK_PAYMENT_METHODS.forEach(pm => pm.isDefault = false);
  }
  
  MOCK_PAYMENT_METHODS.push(newPaymentMethod);
  
  res.status(201).json({
    success: true,
    paymentMethod: newPaymentMethod
  });
}));

/**
 * @swagger
 * /billing/notifications:
 *   get:
 *     summary: Get billing notifications
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Return only unread notifications
 *     responses:
 *       200:
 *         description: List of billing notifications
 */
router.get('/notifications', authenticateToken, catchAsync(async (req: AuthRequest, res: Response) => {
  const { unreadOnly } = req.query;
  
  let notifications = MOCK_NOTIFICATIONS;
  
  if (unreadOnly === 'true') {
    notifications = notifications.filter(n => !n.read);
  }
  
  res.json(notifications);
}));

/**
 * @swagger
 * /billing/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.patch('/notifications/:id/read', authenticateToken, catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const notification = MOCK_NOTIFICATIONS.find(n => n.id === id);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  notification.read = true;
  
  res.json({
    success: true,
    notification
  });
}));

export default router;