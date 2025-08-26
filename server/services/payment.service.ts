import Stripe from "stripe";
import { storage } from '../storage';
import { AppError } from '../middlewares/error.middleware';
import { InsertTenant } from '@shared/schema';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.basil",
}) : null;

export class PaymentService {
  private static planPricing = {
    freemium: { priceId: null, amount: 0 },
    pro: { priceId: "price_pro_monthly", amount: 2900 }, // R$ 29.00 in cents
    enterprise: { priceId: "price_enterprise", amount: 0 } // Custom pricing
  };

  static async createSubscription(
    email: string, 
    planId: string, 
    companyName?: string, 
    paymentMethodId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    if (!stripe) {
      throw new AppError('Stripe not configured. Please provide STRIPE_SECRET_KEY.', 500);
    }

    if (!email || !planId) {
      throw new AppError('Email and plan ID are required', 400);
    }

    const plan = this.planPricing[planId as keyof typeof this.planPricing];
    
    if (!plan) {
      throw new AppError('Invalid plan ID', 400);
    }

    // For freemium plan, no payment needed
    if (planId === "freemium") {
      return {
        success: true,
        requiresPayment: false,
        message: "Freemium account ready"
      };
    }

    // For enterprise, redirect to sales
    if (planId === "enterprise") {
      return {
        success: true,
        requiresPayment: false,
        contactSales: true,
        message: "Enterprise plan requires sales contact"
      };
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: companyName,
      metadata: { plan: planId }
    });

    // Create subscription for Pro plan
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.priceId! }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        plan: planId,
        companyName: companyName || ""
      }
    });

    // Create audit log
    await storage.createAuditLog({
      userId: null,
      tenantId: null,
      action: "subscription_created",
      resourceType: "subscription",
      resourceId: subscription.id,
      metadata: { 
        email, 
        planId, 
        customerId: customer.id,
        subscriptionId: subscription.id 
      },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return {
      success: true,
      requiresPayment: true,
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      customerId: customer.id
    };
  }

  static async confirmSubscription(subscriptionId: string, tenantData: InsertTenant, ipAddress?: string, userAgent?: string) {
    if (!stripe) {
      throw new AppError('Stripe not configured', 500);
    }

    if (!subscriptionId) {
      throw new AppError('Subscription ID is required', 400);
    }

    // Retrieve subscription to verify payment
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.status !== 'active') {
      throw new AppError('Payment not completed', 400);
    }

    // Create tenant with Stripe info
    const tenant = await storage.createTenant({
      ...tenantData,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      status: "active"
    });

    // Create audit log
    await storage.createAuditLog({
      userId: null,
      tenantId: tenant.id,
      action: "tenant_created_with_payment",
      resourceType: "tenant",
      resourceId: tenant.id,
      metadata: { 
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        plan: tenantData.plan 
      },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return {
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan
      }
    };
  }
}