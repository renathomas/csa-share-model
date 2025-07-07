import { db } from '../config/database.js';
import { orders, subscriptions, users, fulfillmentSchedules } from '../models/index.js';
import { AppError } from '../middlewares/error-handler.js';
import { config } from '../config/index.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { scheduleOrderReminder, scheduleOrderLock } from '../config/queues.js';

export class OrderService {
  /**
   * Create orders for a subscription (Share Purchase Model)
   * Creates all orders upfront when subscription is created
   */
  async createOrdersForSubscription(subscriptionId: string) {
    try {
      const [subscription] = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.id, subscriptionId))
        .limit(1);

      if (!subscription) {
        throw new AppError('Subscription not found', 404);
      }

      // Get fulfillment schedule for the subscription type
      const fulfillmentOptions = config.CSA_CONFIG.fulfillmentOptions.find(
        option => option.type === subscription.fulfillmentType
      );

      if (!fulfillmentOptions) {
        throw new AppError('Invalid fulfillment type', 400);
      }

      const schedules = fulfillmentOptions.schedules;
      if (!schedules || schedules.length === 0) {
        throw new AppError('No fulfillment schedules available', 400);
      }

      const createdOrders = [];
      const schedule = schedules[0]!; // Non-null assertion since we checked length above

      // Create orders for each week in the subscription period
      for (let week = 0; week < subscription.totalOrders; week++) {
        // Find the next fulfillment date for this week
        const fulfillmentDate = this.calculateNextFulfillmentDate(
          subscription.periodStart,
          week,
          schedule
        );

        // Calculate cutoff datetime
        const cutoffDatetime = new Date(fulfillmentDate);
        cutoffDatetime.setHours(cutoffDatetime.getHours() - schedule.cutoffHoursBefore);

        const order = await db.insert(orders).values({
          subscriptionId: subscription.id,
          userId: subscription.userId,
          fulfillmentDate: fulfillmentDate.toISOString().split('T')[0],
          fulfillmentTime: schedule.fulfillmentTime!,
          cutoffDatetime,
          status: 'pending' as const,
          totalAmount: subscription.boxPrice,
          notes: null,
        } as any).returning();

        const createdOrder = order[0];
        if (createdOrder) {
          createdOrders.push(createdOrder);

          // Schedule 24-hour reminder
          await scheduleOrderReminder(createdOrder.id, cutoffDatetime);

          // Schedule order locking at cutoff time
          await scheduleOrderLock(createdOrder.id, cutoffDatetime);
        }
      }

      return createdOrders;
    } catch (error) {
      console.error('Error creating orders for subscription:', error);
      throw error;
    }
  }

  /**
   * Get orders for a user
   */
  async getUserOrders(userId: string, limit = 20, offset = 0) {
    const userOrders = await db.select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .limit(limit)
      .offset(offset);

    return userOrders;
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string) {
    const [order] = await db.select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  /**
   * Update order (only allowed before cutoff time)
   */
  async updateOrder(orderId: string, userId: string, updates: {
    notes?: string;
  }) {
    const order = await this.getOrderById(orderId);

    // Verify ownership
    if (order.userId !== userId) {
      throw new AppError('Unauthorized to modify this order', 403);
    }

    // Check if order is still modifiable (before cutoff)
    const now = new Date();
    if (order.status === 'locked' || now >= new Date(order.cutoffDatetime)) {
      throw new AppError('Order cannot be modified after cutoff time', 400);
    }

    const updatedOrder = await db.update(orders)
      .set({
        notes: updates.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    return updatedOrder[0];
  }

  /**
   * Lock order (called at cutoff time)
   */
  async lockOrder(orderId: string) {
    try {
      const order = await this.getOrderById(orderId);

      if (order.status === 'locked') {
        return order; // Already locked
      }

      const lockedOrder = await db.update(orders)
        .set({
          status: 'locked',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      console.log(`🔒 Order ${orderId} locked at cutoff time`);
      return lockedOrder[0];
    } catch (error) {
      console.error(`Error locking order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Fulfill order (mark as completed)
   */
  async fulfillOrder(orderId: string) {
    try {
      const order = await this.getOrderById(orderId);

      if (order.status !== 'locked') {
        throw new AppError('Order must be locked before fulfillment', 400);
      }

      const fulfilledOrder = await db.update(orders)
        .set({
          status: 'fulfilled',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Update subscription remaining orders
      await this.updateSubscriptionRemainingOrders(order.subscriptionId);

      console.log(`📦 Order ${orderId} fulfilled`);
      return fulfilledOrder[0];
    } catch (error) {
      console.error(`Error fulfilling order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, userId: string) {
    const order = await this.getOrderById(orderId);

    // Verify ownership
    if (order.userId !== userId) {
      throw new AppError('Unauthorized to cancel this order', 403);
    }

    // Can't cancel if already fulfilled
    if (order.status === 'fulfilled') {
      throw new AppError('Cannot cancel fulfilled order', 400);
    }

    const cancelledOrder = await db.update(orders)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    return cancelledOrder[0];
  }

  /**
   * Get orders due for reminder (24 hours before cutoff)
   */
  async getOrdersDueForReminder() {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const ordersDue = await db.select()
      .from(orders)
      .where(
        and(
          eq(orders.status, 'pending'),
          gte(orders.cutoffDatetime, now),
          lte(orders.cutoffDatetime, twentyFourHoursFromNow)
        )
      );

    return ordersDue;
  }

  /**
   * Get orders due for locking (past cutoff time)
   */
  async getOrdersDueForLocking() {
    const now = new Date();

    const ordersDue = await db.select()
      .from(orders)
      .where(
        and(
          eq(orders.status, 'pending'),
          lte(orders.cutoffDatetime, now)
        )
      );

    return ordersDue;
  }

  /**
   * Calculate next fulfillment date based on schedule
   */
  private calculateNextFulfillmentDate(
    startDate: Date,
    weekOffset: number,
    schedule: { dayOfWeek: number; fulfillmentTime: string; cutoffHoursBefore: number }
  ): Date {
    const fulfillmentDate = new Date(startDate);
    
    // Add weeks
    fulfillmentDate.setDate(fulfillmentDate.getDate() + (weekOffset * 7));
    
    // Find the next occurrence of the target day of week
    const targetDay = schedule.dayOfWeek;
    const currentDay = fulfillmentDate.getDay();
    const daysToAdd = (targetDay - currentDay + 7) % 7;
    
    fulfillmentDate.setDate(fulfillmentDate.getDate() + daysToAdd);
    
    return fulfillmentDate;
  }

  /**
   * Update subscription remaining orders count
   */
  private async updateSubscriptionRemainingOrders(subscriptionId: string) {
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription) return;

    const newRemainingOrders = Math.max(0, subscription.remainingOrders - 1);

    await db.update(subscriptions)
      .set({
        remainingOrders: newRemainingOrders,
        status: newRemainingOrders === 0 ? 'completed' : subscription.status,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId));

    // If subscription is completed, trigger auto-enrollment
    if (newRemainingOrders === 0) {
      // This will be handled by the subscription worker
      console.log(`🔄 Subscription ${subscriptionId} completed, triggering auto-enrollment`);
    }
  }

  /**
   * Get subscription orders with status
   */
  async getSubscriptionOrders(subscriptionId: string) {
    const subscriptionOrders = await db.select()
      .from(orders)
      .where(eq(orders.subscriptionId, subscriptionId));

    return subscriptionOrders;
  }
}

export const orderService = new OrderService(); 