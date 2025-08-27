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
        apiVersion: "2024-12-18.acacia",
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

  async createSubscription(email: string, priceId: string, paymentMethodId?: string, metadata?: Record<string, string>): Promise<SubscriptionResult> {
    if (!this.initialized || !this.stripe) {
      return { success: false, error: 'Payment service not available' };
    }

    try {
      // First create or find customer
      let customerId: string;
      try {
        const existingCustomers = await this.stripe.customers.list({ email, limit: 1 });
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        } else {
          const customer = await this.stripe.customers.create({ email });
          customerId = customer.id;
        }
      } catch (error) {
        return { success: false, error: 'Failed to create customer' };
      }

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

  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<{success: boolean, subscription?: any, error?: string}> {
    if (!this.initialized || !this.stripe) {
      return { success: false, error: 'Payment service not available' };
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const currentItem = subscription.items.data[0];
      
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: currentItem.id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
        expand: ['latest_invoice.payment_intent'],
      });

      console.log('💳 Subscription updated:', subscriptionId);
      return { success: true, subscription: updatedSubscription };
    } catch (error) {
      console.error('❌ Failed to update subscription:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async createPaymentMethod(customerId: string, paymentMethodId: string): Promise<boolean> {
    if (!this.initialized || !this.stripe) {
      return false;
    }

    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      console.log('💳 Payment method attached:', paymentMethodId);
      return true;
    } catch (error) {
      console.error('❌ Failed to attach payment method:', error);
      return false;
    }
  }

  async getInvoices(customerId: string, limit = 10): Promise<any[]> {
    if (!this.initialized || !this.stripe) {
      return [];
    }

    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
      });
      return invoices.data;
    } catch (error) {
      console.error('❌ Failed to retrieve invoices:', error);
      return [];
    }
  }

  async createUsageRecord(subscriptionItemId: string, quantity: number): Promise<boolean> {
    if (!this.initialized || !this.stripe) {
      return false;
    }

    try {
      await this.stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      });

      console.log('💳 Usage record created:', subscriptionItemId, quantity);
      return true;
    } catch (error) {
      console.error('❌ Failed to create usage record:', error);
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

  async processWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.upcoming':
          await this.handleUpcomingInvoice(event.data.object as Stripe.Invoice);
          break;
        default:
          console.log('Unhandled webhook event:', event.type);
      }
    } catch (error) {
      console.error('❌ Failed to process webhook event:', error);
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log('✅ Payment succeeded for invoice:', invoice.id);
    // TODO: Update tenant subscription status in database
    // TODO: Send payment confirmation email
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log('❌ Payment failed for invoice:', invoice.id);
    // TODO: Update tenant subscription status
    // TODO: Send payment failure notification
    // TODO: Implement retry logic
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log('🔄 Subscription updated:', subscription.id);
    // TODO: Update tenant plan and limits in database
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log('🗑️ Subscription deleted:', subscription.id);
    // TODO: Disable tenant access
    // TODO: Archive tenant data
  }

  private async handleUpcomingInvoice(invoice: Stripe.Invoice): Promise<void> {
    console.log('📅 Upcoming invoice for customer:', invoice.customer);
    // TODO: Send renewal reminder email
  }

  isEnabled(): boolean {
    return this.initialized;
  }
}

export const paymentService = new PaymentService();