import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { AngolaPaymentService } from '../services/angola-payment.service.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AuthRequest } from '../types/auth.types.js';
import { Response } from 'express';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Allow only images and PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF e imagens são permitidos'));
    }
  }
});

// Schema for payment creation
const createAngolaPaymentSchema = z.object({
  invoiceId: z.string(),
  paymentMethod: z.enum(['multicaixa_express', 'unitel_money', 'bank_transfer', 'referencia_pagamento']),
  amount: z.number().positive(),
  
  // Optional fields based on payment method
  unitelPhoneNumber: z.string().optional(),
  unitelTransactionId: z.string().optional(),
  bankName: z.string().optional(),
  bankIban: z.string().optional(),
  accountHolder: z.string().optional(),
  swiftCode: z.string().optional(),
});

/**
 * @swagger
 * /api/angola-payments/instructions/{method}:
 *   get:
 *     summary: Get payment instructions for Angola payment methods
 *     tags: [Angola Payments]
 *     parameters:
 *       - in: path
 *         name: method
 *         required: true
 *         schema:
 *           type: string
 *           enum: [multicaixa_express, unitel_money, bank_transfer, referencia_pagamento]
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Payment instructions
 */
router.get('/instructions/:method', catchAsync(async (req, res: Response) => {
  const { method } = req.params;
  const { amount } = req.query;

  if (!amount || isNaN(Number(amount))) {
    return res.status(400).json({
      success: false,
      message: 'Valor é obrigatório'
    });
  }

  try {
    const instructions = AngolaPaymentService.getPaymentInstructions(method, Number(amount));
    
    res.json({
      success: true,
      data: instructions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    });
  }
}));

/**
 * @swagger
 * /api/angola-payments/create:
 *   post:
 *     summary: Create a new Angola payment
 *     tags: [Angola Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [invoiceId, paymentMethod, amount]
 *             properties:
 *               invoiceId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [multicaixa_express, unitel_money, bank_transfer, referencia_pagamento]
 *               amount:
 *                 type: number
 *               proofOfPayment:
 *                 type: string
 *                 format: binary
 *                 description: Required for bank transfers
 *     responses:
 *       200:
 *         description: Payment created successfully
 */
router.post('/create',
  authenticateToken,
  upload.single('proofOfPayment'),
  catchAsync(async (req: AuthRequest, res: Response) => {
    // Parse JSON fields from multipart form
    const paymentData = JSON.parse(req.body.paymentData || '{}');
    
    // Validate the parsed data
    const validatedData = createAngolaPaymentSchema.parse(paymentData);

    // Check if bank transfer requires proof of payment
    if (validatedData.paymentMethod === 'bank_transfer' && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Comprovativo de pagamento é obrigatório para transferências bancárias'
      });
    }

    try {
      const payment = await AngolaPaymentService.createPayment({
        ...validatedData,
        tenantId: req.user.tenantId,
        proofOfPaymentFile: req.file
      });

      res.json({
        success: true,
        message: 'Pagamento criado com sucesso',
        data: payment
      });
    } catch (error) {
      console.error('Error creating Angola payment:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar pagamento'
      });
    }
  })
);

/**
 * @swagger
 * /api/angola-payments/{id}/approve:
 *   post:
 *     summary: Approve a payment (Admin only)
 *     tags: [Angola Payments]
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
 *         description: Payment approved
 */
router.post('/:id/approve',
  authenticateToken,
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if user is admin (implement proper role checking)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem aprovar pagamentos.'
      });
    }

    try {
      const approval = await AngolaPaymentService.approvePayment(id, req.user.id);
      
      res.json({
        success: true,
        message: 'Pagamento aprovado com sucesso',
        data: approval
      });
    } catch (error) {
      console.error('Error approving payment:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao aprovar pagamento'
      });
    }
  })
);

/**
 * @swagger
 * /api/angola-payments/{id}/reject:
 *   post:
 *     summary: Reject a payment (Admin only)
 *     tags: [Angola Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment rejected
 */
router.post('/:id/reject',
  authenticateToken,
  validateBody(z.object({
    reason: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres')
  })),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem rejeitar pagamentos.'
      });
    }

    try {
      const rejection = await AngolaPaymentService.rejectPayment(id, req.user.id, reason);
      
      res.json({
        success: true,
        message: 'Pagamento rejeitado',
        data: rejection
      });
    } catch (error) {
      console.error('Error rejecting payment:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao rejeitar pagamento'
      });
    }
  })
);

export default router;