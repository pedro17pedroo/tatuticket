import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Mock subscription data
const MOCK_SUBSCRIPTION = {
  id: 'sub_1234567890',
  tenantId: 'tenant_abc123',
  planId: 'professional',
  planName: 'Professional',
  status: 'active',
  currentPeriodStart: new Date('2025-01-01'),
  currentPeriodEnd: new Date('2025-02-01'),
  nextBillingDate: new Date('2025-02-01'),
  amount: 99,
  currency: 'USD',
  interval: 'month',
  cancelAtPeriodEnd: false,
  trialEnd: null
};

const MOCK_USAGE = {
  tickets: { current: 1247, limit: 2000 },
  users: { current: 18, limit: 25 },
  storage: { current: 45.2, limit: 100 },
  apiCalls: { current: 7540, limit: 10000 }
};

const MOCK_BILLING_HISTORY = [
  {
    id: 'inv_001',
    date: new Date('2025-01-01'),
    amount: 99,
    status: 'paid',
    description: 'Professional Plan - January 2025',
    invoiceUrl: '/invoices/inv_001.pdf'
  },
  {
    id: 'inv_002',
    date: new Date('2024-12-01'),
    amount: 99,
    status: 'paid',
    description: 'Professional Plan - December 2024',
    invoiceUrl: '/invoices/inv_002.pdf'
  },
  {
    id: 'inv_003',
    date: new Date('2024-11-01'),
    amount: 99,
    status: 'paid',
    description: 'Professional Plan - November 2024',
    invoiceUrl: '/invoices/inv_003.pdf'
  }
];

const AVAILABLE_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    price: 29,
    interval: 'month',
    features: [
      'Up to 500 tickets/month',
      '5 team members',
      '10GB storage',
      'Email support',
      'Basic analytics'
    ],
    limits: {
      tickets: 500,
      users: 5,
      storage: 10,
      apiCalls: 1000
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses with advanced needs',
    price: 99,
    interval: 'month',
    features: [
      'Up to 2,000 tickets/month',
      '25 team members',
      '100GB storage',
      'Priority support',
      'Advanced analytics',
      'Custom workflows',
      'API access'
    ],
    limits: {
      tickets: 2000,
      users: 25,
      storage: 100,
      apiCalls: 10000
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with complex requirements',
    price: 299,
    interval: 'month',
    features: [
      'Unlimited tickets',
      'Unlimited team members',
      '1TB storage',
      '24/7 premium support',
      'Advanced analytics & reporting',
      'Custom workflows & automation',
      'Full API access',
      'SSO integration',
      'Custom SLAs'
    ],
    limits: {
      tickets: -1, // unlimited
      users: -1,   // unlimited
      storage: 1000,
      apiCalls: 100000
    }
  }
];

// Get current subscription
router.get('/subscription', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      subscription: MOCK_SUBSCRIPTION
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription'
    });
  }
});

// Get usage metrics
router.get('/usage', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      usage: MOCK_USAGE
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage metrics'
    });
  }
});

// Get billing history
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      history: MOCK_BILLING_HISTORY
    });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing history'
    });
  }
});

// Get available plans
router.get('/plans', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      plans: AVAILABLE_PLANS
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans'
    });
  }
});

// Upgrade/change plan
router.post('/upgrade', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    const plan = AVAILABLE_PLANS.find(p => p.id === planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Mock upgrade process
    MOCK_SUBSCRIPTION.planId = plan.id;
    MOCK_SUBSCRIPTION.planName = plan.name;
    MOCK_SUBSCRIPTION.amount = plan.price;

    // Update usage limits based on new plan
    if (plan.limits.tickets !== -1) MOCK_USAGE.tickets.limit = plan.limits.tickets;
    if (plan.limits.users !== -1) MOCK_USAGE.users.limit = plan.limits.users;
    if (plan.limits.storage !== -1) MOCK_USAGE.storage.limit = plan.limits.storage;
    if (plan.limits.apiCalls !== -1) MOCK_USAGE.apiCalls.limit = plan.limits.apiCalls;

    res.json({
      success: true,
      subscription: MOCK_SUBSCRIPTION,
      message: `Successfully upgraded to ${plan.name} plan`
    });
  } catch (error) {
    console.error('Error upgrading plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade plan'
    });
  }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    MOCK_SUBSCRIPTION.cancelAtPeriodEnd = true;

    res.json({
      success: true,
      subscription: MOCK_SUBSCRIPTION,
      message: 'Subscription will be canceled at the end of the current billing period'
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// Resume subscription
router.post('/resume', authenticateToken, async (req: Request, res: Response) => {
  try {
    MOCK_SUBSCRIPTION.cancelAtPeriodEnd = false;

    res.json({
      success: true,
      subscription: MOCK_SUBSCRIPTION,
      message: 'Subscription resumed successfully'
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume subscription'
    });
  }
});

// Download invoice
router.get('/invoice/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = MOCK_BILLING_HISTORY.find(h => h.id === id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Mock invoice download - in real implementation, this would generate/fetch PDF
    res.json({
      success: true,
      downloadUrl: invoice.invoiceUrl,
      message: 'Invoice ready for download'
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download invoice'
    });
  }
});

export default router;