import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { paymentService } from '../integrations/payment.integration';
import { catchAsync } from '../middlewares/error.middleware';
import { validateBody } from '../middlewares/validation.middleware';

const router = Router();

// Schema para criação de assinatura
const createSubscriptionSchema = z.object({
  email: z.string().email(),
  planId: z.string(),
  companyName: z.string(),
  paymentMethodId: z.string(),
  billingInfo: z.object({
    companyName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    taxId: z.string().optional(),
    address: z.object({
      street: z.string(),
      number: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string()
    })
  })
});

// Schema para pagamento boleto/PIX
const createBoletoPixSchema = z.object({
  email: z.string().email(),
  planId: z.string(),
  companyName: z.string(),
  billingInfo: z.object({
    companyName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    taxId: z.string().optional(),
    address: z.object({
      street: z.string(),
      number: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string()
    })
  })
});

// POST /api/payments/create-subscription - Criar assinatura com cartão
router.post('/create-subscription', validateBody(createSubscriptionSchema), catchAsync(async (req: Request, res: Response) => {
  const { email, planId, companyName, paymentMethodId, billingInfo } = req.body;
  
  // Mapear planId para preço do Stripe
  const planPriceMap: { [key: string]: string } = {
    'starter': 'price_starter_monthly',
    'professional': 'price_professional_monthly', 
    'enterprise': 'price_enterprise_monthly'
  };
  
  const stripePriceId = planPriceMap[planId];
  
  if (!stripePriceId) {
    return res.status(400).json({ error: 'Invalid plan ID' });
  }

  try {
    // Mock successful subscription creation for demo
    const mockSubscription = {
      subscription: {
        id: `sub_${Date.now()}`,
        status: 'active',
        customer: companyName,
        current_period_end: Date.now() + 30 * 24 * 60 * 60 * 1000
      },
      clientSecret: null
    };

    if (!paymentService.isEnabled()) {
      return res.json({
        subscriptionId: mockSubscription.subscription.id,
        clientSecret: mockSubscription.clientSecret,
        requiresAction: false,
        status: mockSubscription.subscription.status
      });
    }

    const result = await paymentService.createSubscription(
      email,
      stripePriceId,
      paymentMethodId
    );

    res.json({
      subscriptionId: result.subscriptionId,
      clientSecret: result.clientSecret,
      requiresAction: false,
      status: 'active'
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
}));

// POST /api/payments/create-boleto - Criar pagamento via boleto
router.post('/create-boleto', validateBody(createBoletoPixSchema), catchAsync(async (req: Request, res: Response) => {
  const { email, planId, companyName, billingInfo } = req.body;
  
  // Para demo - simular geração de boleto
  const boletoData = {
    subscriptionId: `sub_boleto_${Date.now()}`,
    boletoUrl: `https://demo-boleto.stripe.com/boleto/${Date.now()}`,
    barCode: '34191.79001 01043.510047 91020.150008 1 84350000014500',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
    amount: planId === 'starter' ? 4900 : planId === 'professional' ? 9900 : 19900
  };

  res.json(boletoData);
}));

// POST /api/payments/create-pix - Criar pagamento via PIX
router.post('/create-pix', validateBody(createBoletoPixSchema), catchAsync(async (req: Request, res: Response) => {
  const { email, planId, companyName, billingInfo } = req.body;
  
  // Para demo - simular geração de PIX
  const pixData = {
    subscriptionId: `sub_pix_${Date.now()}`,
    pixQrCode: '00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540514.005802BR5925TATUTICKET SISTEMAS LTDA6009SAO PAULO62140510SUB123456789063045D6A',
    pixKey: '+55 11 99999-9999',
    amount: planId === 'starter' ? 49.00 : planId === 'professional' ? 99.00 : 199.00,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
  };

  res.json(pixData);
}));

// GET /api/payments/subscription/:id - Obter status da assinatura
router.get('/subscription/:id', catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    if (!paymentService.isEnabled()) {
      // Mock subscription status for demo
      const mockSubscription = {
        id,
        status: 'active',
        customer: 'Demo Customer',
        current_period_end: Date.now() + 30 * 24 * 60 * 60 * 1000,
        plan: { nickname: 'Professional Plan' }
      };
      return res.json(mockSubscription);
    }

    const subscription = await paymentService.getSubscription(id);
    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(404).json({ error: 'Subscription not found' });
  }
}));

// POST /api/payments/cancel-subscription - Cancelar assinatura
router.post('/cancel-subscription', validateBody(z.object({
  subscriptionId: z.string()
})), catchAsync(async (req: Request, res: Response) => {
  const { subscriptionId } = req.body;
  
  try {
    if (!paymentService.isEnabled()) {
      // Mock cancellation for demo
      return res.json({
        id: subscriptionId,
        status: 'canceled',
        canceled_at: Date.now()
      });
    }

    const result = await paymentService.cancelSubscription(subscriptionId);
    res.json(result);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}));

// POST /api/payments/upgrade-subscription - Upgrade/Downgrade assinatura
router.post('/upgrade-subscription', validateBody(z.object({
  subscriptionId: z.string(),
  newPlanId: z.string()
})), catchAsync(async (req: Request, res: Response) => {
  const { subscriptionId, newPlanId } = req.body;
  
  // Mapear planId para preço do Stripe
  const planPriceMap: { [key: string]: string } = {
    'starter': 'price_starter_monthly',
    'professional': 'price_professional_monthly', 
    'enterprise': 'price_enterprise_monthly'
  };
  
  const stripePriceId = planPriceMap[newPlanId];
  
  if (!stripePriceId) {
    return res.status(400).json({ error: 'Invalid plan ID' });
  }

  try {
    if (!paymentService.isEnabled()) {
      // Mock upgrade for demo
      return res.json({
        id: subscriptionId,
        status: 'active',
        plan: newPlanId,
        updated_at: Date.now()
      });
    }

    const result = await paymentService.updateSubscription(subscriptionId, stripePriceId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result.subscription);
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
}));

// GET /api/payments/invoices/:customerId - Obter faturas do cliente
router.get('/invoices/:customerId', catchAsync(async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const { limit } = req.query;
  
  try {
    if (!paymentService.isEnabled()) {
      // Mock invoices for demo
      const mockInvoices = [
        {
          id: 'in_1234',
          amount_paid: 9900,
          amount_due: 0,
          status: 'paid',
          created: Date.now() - 30 * 24 * 60 * 60 * 1000,
          invoice_pdf: 'https://demo-invoice.com/invoice.pdf'
        }
      ];
      return res.json(mockInvoices);
    }

    const invoices = await paymentService.getInvoices(customerId, Number(limit) || 10);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
}));

// POST /api/payments/usage-record - Registrar uso para cobrança por uso
router.post('/usage-record', validateBody(z.object({
  subscriptionItemId: z.string(),
  quantity: z.number().positive()
})), catchAsync(async (req: Request, res: Response) => {
  const { subscriptionItemId, quantity } = req.body;
  
  try {
    if (!paymentService.isEnabled()) {
      // Mock usage record for demo
      return res.json({
        id: `usage_${Date.now()}`,
        quantity,
        timestamp: Math.floor(Date.now() / 1000)
      });
    }

    const result = await paymentService.createUsageRecord(subscriptionItemId, quantity);
    
    if (!result) {
      return res.status(400).json({ error: 'Failed to create usage record' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating usage record:', error);
    res.status(500).json({ error: 'Failed to create usage record' });
  }
}));

// POST /api/payments/webhooks/stripe - Webhook do Stripe
router.post('/webhooks/stripe', catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!endpointSecret) {
    console.warn('Stripe webhook secret not configured');
    return res.status(400).json({ error: 'Webhook not configured' });
  }

  try {
    if (!paymentService.isEnabled()) {
      return res.json({ received: true });
    }

    const event = await paymentService.handleWebhook(req.body, signature);
    
    if (!event) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
    
    // Process the webhook event
    await paymentService.processWebhookEvent(event);
    
    console.log('✅ Webhook processed successfully:', event.type);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Invalid webhook' });
  }
}));

export default router;