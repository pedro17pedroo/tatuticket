import Stripe from "stripe";
import { config } from '../config/app.config';

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  customerId?: string;
  clientSecret?: string;
  error?: string;
}

class PaymentService {
  private stripe: Stripe | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (!config.payment.enabled) {
      console.warn('💳 Payment service disabled - Stripe configuration missing');
      return;
    }

    try {
      this.stripe = new Stripe(config.payment.stripe.secretKey!, {
        apiVersion: "2025-01-27.basil",
      });

      this.initialized = true;
      console.log('💳 Payment service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize payment service:', error);
    }
  }

  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<{success: boolean, customerId?: string, error?: string}> {
    if (!this.initialized || !this.stripe) {
      return { success: false, error: 'Payment service not available' };
    }

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });

      console.log('💳 Customer created:', customer.id);
      return { success: true, customerId: customer.id };
    } catch (error) {
      console.error('❌ Failed to create customer:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async createSubscription(customerId: string, priceId: string, metadata?: Record<string, string>): Promise<SubscriptionResult> {
    if (!this.initialized || !this.stripe) {
      return { success: false, error: 'Payment service not available' };
    }

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata,
      });

      console.log('💳 Subscription created:', subscription.id);
      
      return {
        success: true,
        subscriptionId: subscription.id,
        customerId: customerId,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      };
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    if (!this.initialized || !this.stripe) {
      return { success: false, error: 'Payment service not available' };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      
      console.log('💳 Payment confirmed:', paymentIntent.id);
      return { 
        success: paymentIntent.status === 'succeeded', 
        paymentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('❌ Failed to confirm payment:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getSubscription(subscriptionId: string) {
    if (!this.initialized || !this.stripe) {
      return null;
    }

    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('❌ Failed to retrieve subscription:', error);
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.initialized || !this.stripe) {
      return false;
    }

    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
      console.log('💳 Subscription cancelled:', subscriptionId);
      return true;
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      return false;
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<Stripe.Event | null> {
    if (!this.initialized || !this.stripe || !config.payment.stripe.webhookSecret) {
      return null;
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload, 
        signature, 
        config.payment.stripe.webhookSecret
      );
    } catch (error) {
      console.error('❌ Failed to handle webhook:', error);
      return null;
    }
  }

  isEnabled(): boolean {
    return this.initialized;
  }
}

export const paymentService = new PaymentService();