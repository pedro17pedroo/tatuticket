import { Router, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { catchAsync } from '../middlewares/error.middleware';
import { paymentService } from '../integrations/payment.integration';

const router = Router();

// Mock data for financial dashboard
const MOCK_FINANCIAL_METRICS = {
  totalRevenue: 485000,
  monthlyRevenue: 42500,
  annualRevenue: 510000,
  revenueGrowth: 12.5,
  activeTenants: 127,
  totalTenants: 145,
  tenantGrowth: 8.2,
  averageRevenuePerTenant: 334.65,
  churnRate: 3.2,
  lifetimeValue: 8450,
  mrr: 42500,
  arr: 510000,
  billingIssues: 8,
  overdueAmount: 15600
};

const MOCK_REVENUE_TREND = [
  { month: 'Jul', revenue: 35000, growth: 5.2, tenants: 89 },
  { month: 'Ago', revenue: 38500, growth: 10.0, tenants: 98 },
  { month: 'Set', revenue: 40200, growth: 4.4, tenants: 108 },
  { month: 'Out', revenue: 41800, growth: 4.0, tenants: 119 },
  { month: 'Nov', revenue: 43200, growth: 3.3, tenants: 132 },
  { month: 'Dez', revenue: 44100, growth: 2.1, tenants: 140 },
  { month: 'Jan', revenue: 42500, growth: -3.6, tenants: 145 }
];

const MOCK_TENANT_FINANCIAL_DATA = [
  {
    tenantId: '1',
    tenantName: 'TechCorp Solutions',
    plan: 'Enterprise',
    monthlyRevenue: 2500,
    annualRevenue: 30000,
    usageMetrics: { tickets: 1250, users: 45, storage: 15.5, apiCalls: 8500 },
    billingStatus: 'active',
    nextBillingDate: new Date('2025-02-15'),
    lastPayment: new Date('2025-01-15'),
    paymentMethod: 'Credit Card (**** 4532)',
    stripeCustomerId: 'cus_techcorp123'
  },
  {
    tenantId: '2',
    tenantName: 'StartupXYZ',
    plan: 'Professional',
    monthlyRevenue: 99,
    annualRevenue: 1188,
    usageMetrics: { tickets: 240, users: 12, storage: 2.8, apiCalls: 1200 },
    billingStatus: 'active',
    nextBillingDate: new Date('2025-02-08'),
    lastPayment: new Date('2025-01-08'),
    paymentMethod: 'Credit Card (**** 1234)',
    stripeCustomerId: 'cus_startup456'
  },
  {
    tenantId: '3',
    tenantName: 'BigCorp Inc',
    plan: 'Enterprise Plus',
    monthlyRevenue: 5000,
    annualRevenue: 60000,
    usageMetrics: { tickets: 3500, users: 120, storage: 45.2, apiCalls: 25000 },
    billingStatus: 'overdue',
    nextBillingDate: new Date('2025-01-20'),
    lastPayment: new Date('2024-12-20'),
    paymentMethod: 'Credit Card (**** 9876)',
    stripeCustomerId: 'cus_bigcorp789'
  }
];

const MOCK_PLAN_ANALYTICS = [
  { plan: 'Starter', tenants: 45, revenue: 2205, growth: 15.2 },
  { plan: 'Professional', tenants: 78, revenue: 23400, growth: 8.7 },
  { plan: 'Enterprise', tenants: 22, revenue: 55000, growth: 12.1 }
];

// GET /api/admin/financial-metrics - Obter métricas financeiras gerais
router.get('/financial-metrics', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      // In real implementation, calculate from database
      res.json({
        success: true,
        metrics: MOCK_FINANCIAL_METRICS
      });
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch financial metrics'
      });
    }
  })
);

// GET /api/admin/revenue-trend - Obter tendência de receita
router.get('/revenue-trend', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const { period = '12m' } = req.query;
      
      res.json({
        success: true,
        trend: MOCK_REVENUE_TREND,
        period
      });
    } catch (error) {
      console.error('Error fetching revenue trend:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch revenue trend'
      });
    }
  })
);

// GET /api/admin/tenant-financial-data - Obter dados financeiros dos tenants
router.get('/tenant-financial-data', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 10, status, plan } = req.query;
      
      let filteredData = [...MOCK_TENANT_FINANCIAL_DATA];
      
      if (status) {
        filteredData = filteredData.filter(t => t.billingStatus === status);
      }
      
      if (plan) {
        filteredData = filteredData.filter(t => t.plan.toLowerCase().includes((plan as string).toLowerCase()));
      }
      
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedData = filteredData.slice(startIndex, startIndex + Number(limit));
      
      res.json({
        success: true,
        tenants: paginatedData,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching tenant financial data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tenant financial data'
      });
    }
  })
);

// GET /api/admin/plan-analytics - Obter análise por plano
router.get('/plan-analytics', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      res.json({
        success: true,
        analytics: MOCK_PLAN_ANALYTICS
      });
    } catch (error) {
      console.error('Error fetching plan analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch plan analytics'
      });
    }
  })
);

// POST /api/admin/suspend-tenant - Suspender tenant por inadimplência
router.post('/suspend-tenant/:tenantId', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const { tenantId } = req.params;
      const { reason } = req.body;
      
      // In real implementation, update tenant status in database
      console.log(`Suspending tenant ${tenantId} for reason: ${reason}`);
      
      res.json({
        success: true,
        message: 'Tenant suspended successfully'
      });
    } catch (error) {
      console.error('Error suspending tenant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suspend tenant'
      });
    }
  })
);

// POST /api/admin/reactivate-tenant - Reativar tenant
router.post('/reactivate-tenant/:tenantId', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const { tenantId } = req.params;
      
      // In real implementation, update tenant status in database
      console.log(`Reactivating tenant ${tenantId}`);
      
      res.json({
        success: true,
        message: 'Tenant reactivated successfully'
      });
    } catch (error) {
      console.error('Error reactivating tenant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reactivate tenant'
      });
    }
  })
);

// GET /api/admin/billing-issues - Obter problemas de cobrança
router.get('/billing-issues', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const billingIssues = [
        {
          tenantId: '3',
          tenantName: 'BigCorp Inc',
          type: 'overdue',
          amount: 5000,
          daysPastDue: 15,
          lastAttempt: new Date('2025-01-20'),
          attempts: 3
        },
        {
          tenantId: '7',
          tenantName: 'RetailCorp',
          type: 'failed_payment',
          amount: 1200,
          daysPastDue: 3,
          lastAttempt: new Date('2025-01-25'),
          attempts: 1
        }
      ];
      
      res.json({
        success: true,
        issues: billingIssues
      });
    } catch (error) {
      console.error('Error fetching billing issues:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch billing issues'
      });
    }
  })
);

// POST /api/admin/retry-billing - Tentar cobrança novamente
router.post('/retry-billing/:tenantId', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const { tenantId } = req.params;
      
      // In real implementation, trigger Stripe retry
      if (paymentService.isEnabled()) {
        // Implement actual retry logic with Stripe
        console.log(`Retrying billing for tenant ${tenantId}`);
      }
      
      res.json({
        success: true,
        message: 'Billing retry initiated'
      });
    } catch (error) {
      console.error('Error retrying billing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retry billing'
      });
    }
  })
);

/**
 * @swagger
 * /api/admin/financial-metrics:
 *   get:
 *     summary: Get financial metrics
 *     description: Retrieve comprehensive financial metrics for admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [current_month, last_3_months, last_6_months, current_year]
 *         description: Time period for financial data
 *     responses:
 *       200:
 *         description: Financial metrics data
 */
router.get('/financial-metrics',
  authenticateToken,
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { period = 'current_month' } = req.query;
    
    // Mock comprehensive financial metrics
    const financialMetrics = {
      totalRevenue: 284500,
      monthlyRecurring: 45600,
      growth: 12.5,
      churnRate: 3.2,
      averageRevenuePerUser: 89.50,
      lifetimeValue: 2850,
      conversionRate: 18.3,
      customerAcquisitionCost: 65.00,
      netRevenue: 256050,
      grossMargin: 78.2
    };

    res.json({
      success: true,
      data: financialMetrics
    });
  })
);

/**
 * @swagger
 * /api/admin/tenants-financial:
 *   get:
 *     summary: Get tenants financial data
 *     description: Retrieve financial data for all tenants
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Time period for data
 *     responses:
 *       200:
 *         description: Tenants financial data
 */
router.get('/tenants-financial',
  authenticateToken,
  catchAsync(async (req: AuthRequest, res: Response) => {
    const tenantsFinancialData = [
      {
        id: '1',
        name: 'Empresa Tech Solutions',
        plan: 'Enterprise',
        mrr: 249,
        totalRevenue: 2988,
        users: 45,
        tickets: 1247,
        status: 'active',
        joinDate: '2024-01-15',
        lastPayment: '2025-01-15',
        healthScore: 92
      },
      {
        id: '2',
        name: 'StartupCorp',
        plan: 'Professional',
        mrr: 99,
        totalRevenue: 792,
        users: 12,
        tickets: 345,
        status: 'active',
        joinDate: '2024-06-20',
        lastPayment: '2025-01-20',
        healthScore: 78
      },
      {
        id: '3',
        name: 'Digital Agency',
        plan: 'Starter',
        mrr: 29,
        totalRevenue: 348,
        users: 5,
        tickets: 123,
        status: 'active',
        joinDate: '2024-11-01',
        lastPayment: '2025-01-01',
        healthScore: 85
      }
    ];

    res.json({
      success: true,
      data: tenantsFinancialData
    });
  })
);

export default router;