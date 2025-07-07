import { db } from '../config/database.js';
import { notifications, users } from '../models/index.js';
import { AppError } from '../middlewares/error-handler.js';
import { config } from '../config/index.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// TODO: Fix Twilio import and initialization for SMS functionality

export class NotificationService {
  /**
   * Send SMS notification
   */
  async sendSMS(to: string, message: string) {
    try {
      // Temporarily disabled for development
      // TODO: Fix Twilio implementation
      console.log(`📱 SMS simulation - would send to ${to}: ${message}`);
      return { sid: 'dev-mode-' + Date.now() };
    } catch (error) {
      console.error('SMS sending error:', error);
      throw new AppError('Failed to send SMS', 500);
    }
  }

  /**
   * Send email notification (placeholder - would integrate with email service)
   */
  async sendEmail(to: string, subject: string, body: string) {
    try {
      // Placeholder for email service integration
      // In a real implementation, you would integrate with:
      // - SendGrid
      // - AWS SES
      // - Nodemailer with SMTP
      
      console.log(`📧 Email sent to ${to}: ${subject}`);
      return { success: true, recipient: to, subject };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new AppError('Failed to send email', 500);
    }
  }

  /**
   * Send order reminder notification
   */
  async sendOrderReminder(userId: string, orderId: string) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const message = `Hi ${user.name}! Your CSA order deadline is in 24 hours. Please review and finalize your order. Order ID: ${orderId}`;

      // Send SMS if phone number is available
      if (user.phone) {
        await this.sendSMS(user.phone, message);
      }

      // Send email
      await this.sendEmail(
        user.email,
        'CSA Order Reminder - 24 Hours Left',
        message
      );

      // Record notification
      await this.recordNotification({
        userId,
        orderId,
        type: 'order_reminder',
        message,
        method: user.phone ? 'sms_and_email' : 'email',
        status: 'sent',
      });

      return { success: true };
    } catch (error) {
      console.error('Order reminder error:', error);
      
      // Record failed notification
      await this.recordNotification({
        userId,
        orderId,
        type: 'order_reminder',
        message: 'Failed to send order reminder',
        method: 'failed',
        status: 'failed',
      });

      throw error;
    }
  }

  /**
   * Send order locked notification
   */
  async sendOrderLockedNotification(userId: string, orderId: string) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const message = `Hi ${user.name}! Your CSA order has been locked and will be prepared for fulfillment. Order ID: ${orderId}`;

      // Send SMS if phone number is available
      if (user.phone) {
        await this.sendSMS(user.phone, message);
      }

      // Send email
      await this.sendEmail(
        user.email,
        'CSA Order Locked - Preparation Started',
        message
      );

      // Record notification
      await this.recordNotification({
        userId,
        orderId,
        type: 'order_locked',
        message,
        method: user.phone ? 'sms_and_email' : 'email',
        status: 'sent',
      });

      return { success: true };
    } catch (error) {
      console.error('Order locked notification error:', error);
      
      await this.recordNotification({
        userId,
        orderId,
        type: 'order_locked',
        message: 'Failed to send order locked notification',
        method: 'failed',
        status: 'failed',
      });

      throw error;
    }
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailedNotification(userId: string, subscriptionId: string) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const message = `Hi ${user.name}! Your CSA subscription payment failed. Please update your payment method to continue your subscription.`;

      // Send SMS if phone number is available
      if (user.phone) {
        await this.sendSMS(user.phone, message);
      }

      // Send email
      await this.sendEmail(
        user.email,
        'CSA Payment Failed - Action Required',
        message
      );

      // Record notification
      await this.recordNotification({
        userId,
        subscriptionId,
        type: 'payment_failed',
        message,
        method: user.phone ? 'sms_and_email' : 'email',
        status: 'sent',
      });

      return { success: true };
    } catch (error) {
      console.error('Payment failed notification error:', error);
      
      await this.recordNotification({
        userId,
        subscriptionId,
        type: 'payment_failed',
        message: 'Failed to send payment failed notification',
        method: 'failed',
        status: 'failed',
      });

      throw error;
    }
  }

  /**
   * Send subscription renewed notification
   */
  async sendSubscriptionRenewedNotification(userId: string, subscriptionId: string) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const message = `Hi ${user.name}! Your CSA subscription has been automatically renewed. Your new order cycle begins now!`;

      // Send SMS if phone number is available
      if (user.phone) {
        await this.sendSMS(user.phone, message);
      }

      // Send email
      await this.sendEmail(
        user.email,
        'CSA Subscription Renewed - New Cycle Started',
        message
      );

      // Record notification
      await this.recordNotification({
        userId,
        subscriptionId,
        type: 'subscription_renewed',
        message,
        method: user.phone ? 'sms_and_email' : 'email',
        status: 'sent',
      });

      return { success: true };
    } catch (error) {
      console.error('Subscription renewed notification error:', error);
      
      await this.recordNotification({
        userId,
        subscriptionId,
        type: 'subscription_renewed',
        message: 'Failed to send subscription renewed notification',
        method: 'failed',
        status: 'failed',
      });

      throw error;
    }
  }

  /**
   * Record notification in database
   */
  private async recordNotification(notificationData: {
    userId: string;
    orderId?: string;
    subscriptionId?: string;
    type: 'order_reminder' | 'order_locked' | 'payment_failed' | 'subscription_renewed';
    message: string;
    method: 'sms' | 'email' | 'sms_and_email' | 'failed';
    status: 'sent' | 'failed';
  }) {
    const notification = await db.insert(notifications).values({
      userId: notificationData.userId,
      orderId: notificationData.orderId || null,
      type: notificationData.type,
      message: notificationData.message,
      status: notificationData.status,
      scheduledAt: new Date(),
    }).returning();

    return notification[0];
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit = 20, offset = 0) {
    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .limit(limit)
      .offset(offset);

    return userNotifications;
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string, userId: string) {
    const updatedNotification = await db.update(notifications)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, notificationId))
      .returning();

    return updatedNotification[0];
  }
}

export const notificationService = new NotificationService(); 