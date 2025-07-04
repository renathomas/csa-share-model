import { db } from '../config/database.js';
import { subscriptions } from '../models/index.js';
import { AppError } from '../middlewares/error-handler.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

export class SubscriptionService {
  async createSubscription(data: any) {
    const { boxSize, fulfillmentType, paymentInterval, userId } = data;
    
    // Get box price from configuration
    const boxConfig = config.CSA_CONFIG.boxSizes.find(box => box.size === boxSize);
    if (!boxConfig) {
      throw new AppError('Invalid box size', 400);
    }
    
    // Get payment interval configuration for discount
    const intervalConfig = config.CSA_CONFIG.paymentIntervals.find(interval => interval.weeks === paymentInterval);
    if (!intervalConfig) {
      throw new AppError('Invalid payment interval', 400);
    }
    
    // Calculate final box price with discount
    const basePrice = boxConfig.price;
    const discount = intervalConfig.discount || 0;
    const finalBoxPrice = basePrice * (1 - discount);
    
    // Calculate period dates
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodStart.getDate() + (paymentInterval * 7)); // weeks to days
    
    const subscription = await db.insert(subscriptions).values({
      userId,
      boxSize,
      fulfillmentType,
      paymentInterval,
      boxPrice: finalBoxPrice.toFixed(2),
      totalOrders: paymentInterval,
      remainingOrders: paymentInterval,
      status: 'active',
      periodStart,
      periodEnd,
      stripeSubscriptionId: null
    }).returning();

    return subscription[0];
  }

  async getSubscriptionById(id: string) {
    const subscription = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (subscription.length === 0) {
      throw new AppError('Subscription not found', 404);
    }

    return subscription[0];
  }

  async getUserSubscriptions(userId: string) {
    const userSubscriptions = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    return userSubscriptions;
  }
}

export const subscriptionService = new SubscriptionService(); 