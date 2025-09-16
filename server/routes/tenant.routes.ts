import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { tenants, users, departments, subscriptions, invoices } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { catchAsync } from '../middlewares/error.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { paymentService } from '../integrations/payment.integration';

const router = Router();

// Schema for tenant onboarding
const onboardTenantSchema = z.object({
  company: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    industry: z.string(),
    size: z.string(),
    description: z.string().optional(),
  }),
  contact: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    position: z.string(),
  }),
  address: z.object({
    street: z.string(),
    number: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('BR'),
  }),
  plan: z.object({
    selected: z.string(),
    billingCycle: z.enum(['monthly', 'yearly']),
  }),
  configuration: z.object({
    departments: z.array(z.string()),
    agents: z.number(),
    expectedTickets: z.number(),
    integrations: z.array(z.string()),
  }),
});

// POST /api/tenants/onboard - Complete tenant onboarding
router.post('/onboard', validateBody(onboardTenantSchema), catchAsync(async (req: Request, res: Response) => {
  const { company, contact, address, plan, configuration } = req.body;
  
  try {
    // Create tenant
    const tenant = await db.insert(tenants).values({
      name: company.name,
      slug: company.slug,
      plan: plan.selected,
      status: 'trial', // Start with trial
      settings: {
        company: {
          industry: company.industry,
          size: company.size,
          description: company.description,
          address,
        },
        configuration,
      },
    }).returning();

    const tenantId = tenant[0].id;

    // Create admin user
    const adminUser = await db.insert(users).values({
      username: contact.email,
      email: contact.email,
      password: 'temp_password', // Will be reset on first login
      role: 'admin',
      tenantId,
      isActive: true,
    }).returning();

    // Create departments
    if (configuration.departments.length > 0) {
      const departmentsData = configuration.departments.map((deptName: string) => ({
        name: deptName,
        tenantId,
        managerEmail: contact.email,
        status: 'active' as const,
        isActive: true,
      }));
      
      await db.insert(departments).values(departmentsData);
    }

    // Create subscription record
    const planPricing = {
      starter: { monthly: 49, yearly: 470 },
      professional: { monthly: 99, yearly: 950 },
      enterprise: { monthly: 199, yearly: 1910 },
    } as const;

    const amount = (planPricing as any)[plan.selected]?.[plan.billingCycle] || 0;

    const subscription = await db.insert(subscriptions).values({
      tenantId,
      plan: plan.selected,
      status: 'trialing',
      billingCycle: plan.billingCycle,
      amount: amount.toString(),
      currency: 'brl',
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      metadata: {
        onboardingData: { company, contact, configuration },
      },
    }).returning();

    // If payment service is available, create Stripe customer
    let stripeCustomerId = null;
    if (paymentService.isEnabled()) {
      const customerResult = await paymentService.createCustomer(
        contact.email,
        company.name,
        {
          tenant_id: tenantId,
          onboarding: 'true',
        }
      );
      
      if (customerResult.success) {
        stripeCustomerId = customerResult.customerId;
        
        // Update tenant with Stripe customer ID
        await db.update(tenants)
          .set({ stripeCustomerId })
          .where(eq(tenants.id, tenantId));
      }
    }

    res.json({
      tenant: tenant[0],
      user: { ...adminUser[0], password: undefined }, // Don't return password
      subscription: subscription[0],
      stripeCustomerId,
      message: 'Tenant onboarded successfully. Check email for login instructions.',
    });

  } catch (error) {
    console.error('Error onboarding tenant:', error);
    res.status(500).json({ error: 'Failed to onboard tenant' });
  }
}));

// GET /api/tenants/:id - Get tenant details
router.get('/:id', catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, id),
    with: {
      users: {
        columns: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
      departments: true,
    },
  });
  
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  // Get subscription info
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.tenantId, id),
    orderBy: desc(subscriptions.createdAt),
  });
  
  res.json({
    tenant,
    subscription,
  });
}));

// PUT /api/tenants/:id - Update tenant
router.put('/:id', catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const tenant = await db.update(tenants)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, id))
    .returning();
  
  if (tenant.length === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  res.json(tenant[0]);
}));

// POST /api/tenants/:id/activate - Activate tenant subscription
router.post('/:id/activate', catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentMethodId, billingInfo } = req.body;
  
  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.tenantId, id),
      orderBy: desc(subscriptions.createdAt),
    });
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Activate subscription
    await db.update(subscriptions)
      .set({
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (subscription.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));
    
    // Update tenant status
    await db.update(tenants)
      .set({
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id));
    
    res.json({
      success: true,
      message: 'Subscription activated successfully',
    });
    
  } catch (error) {
    console.error('Error activating tenant:', error);
    res.status(500).json({ error: 'Failed to activate tenant' });
  }
}));

// GET /api/tenants/:id/analytics - Get tenant analytics
router.get('/:id/analytics', catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { period = '30d' } = req.query;
  
  // Mock analytics for now - in real implementation would calculate from actual data
  const analytics = {
    tickets: {
      total: 156,
      open: 23,
      inProgress: 45,
      resolved: 88,
      trend: 12.5,
    },
    agents: {
      total: 8,
      active: 6,
      avgResponseTime: 1.2, // hours
      satisfaction: 4.6,
    },
    sla: {
      compliance: 94.5,
      breaches: 3,
      avgResolutionTime: 4.8, // hours
    },
    volume: [
      { date: '2024-01-01', tickets: 12 },
      { date: '2024-01-02', tickets: 18 },
      { date: '2024-01-03', tickets: 15 },
      // ... more data points
    ],
  };
  
  res.json(analytics);
}));

// DELETE /api/tenants/:id - Delete tenant (soft delete)
router.delete('/:id', catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Soft delete by setting status to inactive
  const tenant = await db.update(tenants)
    .set({
      status: 'suspended',
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, id))
    .returning();
  
  if (tenant.length === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  // Also deactivate subscription
  await db.update(subscriptions)
    .set({
      status: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.tenantId, id));
  
  res.json({
    success: true,
    message: 'Tenant suspended successfully',
  });
}));

export default router;