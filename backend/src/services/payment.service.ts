import Stripe from 'stripe';
import { db } from '../config/database.js';
import { payments, subscriptions, users } from '../models/index.js';
import { AppError } from '../middlewares/error-handler.js';
import { config } from '../config/index.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Initialize Stripe
const stripe = new Stripe(config.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export class PaymentService {
  /**
   * Create upfront payment for subscription (Share Purchase Model)
   */
  async processSubscriptionPayment(
    userId: string,
    subscriptionId: string,
    paymentMethodId: string,
    amount: number
  ) {
    try {
      // Get user and subscription details
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);

      if (!user || !subscription) {
        throw new AppError('User or subscription not found', 404);
      }

      // Ensure user has a Stripe customer ID
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customerData: any = {
          email: user.email,
          name: user.name,
          metadata: {
            userId: user.id,
          },
        };
        if (user.phone) {
          customerData.phone = user.phone;
        }
        const customer = await stripe.customers.create(customerData);
        customerId = customer.id;

        // Update user with Stripe customer ID
        await db.update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, userId));
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Create payment intent for upfront payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        description: `CSA Subscription Payment - ${subscription.totalOrders} weeks`,
        metadata: {
          userId,
          subscriptionId,
          paymentType: 'subscription',
        },
      });

      // Handle payment intent status
      if (paymentIntent.status === 'requires_action') {
        return {
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
        };
      } else if (paymentIntent.status === 'succeeded') {
        // Record successful payment
        const payment = await this.recordPayment({
          userId,
          subscriptionId,
          paymentType: 'subscription',
          amount,
          paymentMethodId,
          transactionId: paymentIntent.id,
          status: 'completed',
          stripePaymentIntentId: paymentIntent.id,
        });

        // Update subscription with Stripe info
        await db.update(subscriptions)
          .set({ stripeSubscriptionId: paymentIntent.id })
          .where(eq(subscriptions.id, subscriptionId));

        return {
          success: true,
          payment,
          paymentIntent,
        };
      } else {
        throw new AppError('Payment failed', 400);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      
      // Record failed payment
      await this.recordPayment({
        userId,
        subscriptionId,
        paymentType: 'subscription',
        amount,
        paymentMethodId,
        status: 'failed',
      });

      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Payment failed: ${error.message}`, 400);
      }
      throw error;
    }
  }

  /**
   * Process add-on payment (separate from subscription)
   */
  async processAddonPayment(
    userId: string,
    orderId: string,
    paymentMethodId: string,
    amount: number
  ) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        throw new AppError('User does not have a payment method setup', 400);
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        description: `CSA Add-on Payment`,
        metadata: {
          userId,
          orderId,
          paymentType: 'addon',
        },
      });

      if (paymentIntent.status === 'succeeded') {
        const payment = await this.recordPayment({
          userId,
          orderId,
          paymentType: 'addon',
          amount,
          paymentMethodId,
          transactionId: paymentIntent.id,
          status: 'completed',
          stripePaymentIntentId: paymentIntent.id,
        });

        return {
          success: true,
          payment,
          paymentIntent,
        };
      } else {
        throw new AppError('Add-on payment failed', 400);
      }
    } catch (error) {
      console.error('Add-on payment error:', error);
      
      await this.recordPayment({
        userId,
        orderId,
        paymentType: 'addon',
        amount,
        paymentMethodId,
        status: 'failed',
      });

      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Payment failed: ${error.message}`, 400);
      }
      throw error;
    }
  }

  /**
   * Create payment method for customer
   */
  async createPaymentMethod(
    userId: string,
    type: 'card',
    cardDetails: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    }
  ) {
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type,
        card: cardDetails,
      });

      return paymentMethod;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Payment method creation failed: ${error.message}`, 400);
      }
      throw error;
    }
  }

  /**
   * Process refund for cancelled subscription
   */
  async processRefund(paymentIntentId: string, amount?: number) {
    try {
      const refundData: any = {
        payment_intent: paymentIntentId,
      };
      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }
      
      const refund = await stripe.refunds.create(refundData);

      return refund;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Refund failed: ${error.message}`, 400);
      }
      throw error;
    }
  }

  /**
   * Record payment in database
   */
  private async recordPayment(paymentData: {
    userId: string;
    subscriptionId?: string;
    orderId?: string;
    paymentType: 'subscription' | 'addon';
    amount: number;
    paymentMethodId?: string;
    transactionId?: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    stripePaymentIntentId?: string;
  }) {
    const payment = await db.insert(payments).values({
      id: uuidv4(),
      userId: paymentData.userId,
      subscriptionId: paymentData.subscriptionId || null,
      orderId: paymentData.orderId || null,
      paymentType: paymentData.paymentType,
      amount: paymentData.amount.toFixed(2),
      paymentMethodId: paymentData.paymentMethodId || null,
      transactionId: paymentData.transactionId || null,
      status: paymentData.status,
      stripePaymentIntentId: paymentData.stripePaymentIntentId || null,
    }).returning();

    return payment[0];
  }

  /**
   * Get customer's payment methods
   */
  async getCustomerPaymentMethods(userId: string) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user || !user.stripeCustomerId) {
        return [];
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  /**
   * Calculate total cost for subscription with discount
   */
  calculateSubscriptionCost(boxSize: 'small' | 'large', paymentInterval: number): number {
    const boxConfig = config.CSA_CONFIG.boxSizes.find(box => box.size === boxSize);
    const intervalConfig = config.CSA_CONFIG.paymentIntervals.find(interval => interval.weeks === paymentInterval);
    
    if (!boxConfig || !intervalConfig) {
      throw new AppError('Invalid box size or payment interval', 400);
    }

    const basePrice = boxConfig.price;
    const totalOrders = paymentInterval;
    const subtotal = basePrice * totalOrders;
    const discount = intervalConfig.discount || 0;
    
    return subtotal * (1 - discount);
  }
}

export const paymentService = new PaymentService(); 