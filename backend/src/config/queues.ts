import { Queue } from 'bullmq';
import { config } from './index.js';

// Redis connection configuration
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
};

// Queue specifications
export const queueSpecs = [
  {
    key: 'orderProcessing',
    name: 'Order Processing',
    description: 'Handles order creation, locking, and fulfillment',
    readOnlyMode: false,
    allowRetries: true,
  },
  {
    key: 'notifications',
    name: 'Notifications',
    description: 'Handles SMS and email notifications',
    readOnlyMode: false,
    allowRetries: true,
  },
  {
    key: 'payments',
    name: 'Payments',
    description: 'Handles Stripe payment processing',
    readOnlyMode: false,
    allowRetries: true,
  },
  {
    key: 'subscriptions',
    name: 'Subscriptions',
    description: 'Handles subscription auto-enrollment and renewals',
    readOnlyMode: false,
    allowRetries: true,
  },
];

// Initialize queues
export const queues: Record<string, Queue> = {};

export function initQueues() {
  for (const queueSpec of queueSpecs) {
    if (!queues[queueSpec.key]) {
      queues[queueSpec.key] = new Queue(queueSpec.name, {
        connection: redisConnection,
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 20,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });
      console.log(`✅ Queue "${queueSpec.name}" initialized`);
    }
  }
}

// Export individual queues for easier access
export const orderQueue = () => queues.orderProcessing;
export const notificationQueue = () => queues.notifications;
export const paymentQueue = () => queues.payments;
export const subscriptionQueue = () => queues.subscriptions;

// Job types
export interface OrderProcessingJob {
  type: 'CREATE_ORDERS' | 'LOCK_ORDER' | 'FULFILL_ORDER';
  subscriptionId: string;
  userId: string;
  orderId?: string;
}

export interface NotificationJob {
  type: 'ORDER_REMINDER' | 'ORDER_LOCKED' | 'PAYMENT_FAILED' | 'SUBSCRIPTION_RENEWED';
  userId: string;
  orderId?: string;
  subscriptionId?: string;
  message: string;
  phone?: string;
  email?: string;
}

export interface PaymentJob {
  type: 'PROCESS_SUBSCRIPTION_PAYMENT' | 'PROCESS_ADDON_PAYMENT' | 'PROCESS_REFUND';
  subscriptionId?: string;
  orderId?: string;
  paymentMethodId: string;
  amount: number;
  userId: string;
}

export interface SubscriptionJob {
  type: 'AUTO_ENROLL' | 'RENEW_SUBSCRIPTION' | 'CANCEL_SUBSCRIPTION';
  subscriptionId: string;
  userId: string;
}

// Job scheduling helpers
export function scheduleOrderReminder(orderId: string, cutoffTime: Date) {
  const reminderTime = new Date(cutoffTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
  const delay = reminderTime.getTime() - Date.now();
  
  if (delay > 0) {
    return notificationQueue()!.add(
      'order-reminder',
      {
        type: 'ORDER_REMINDER',
        orderId,
      } as NotificationJob,
      {
        delay,
        jobId: `reminder-${orderId}`,
      }
    );
  }
}

export function scheduleOrderLock(orderId: string, cutoffTime: Date) {
  const delay = cutoffTime.getTime() - Date.now();
  
  if (delay > 0) {
    return orderQueue()!.add(
      'lock-order',
      {
        type: 'LOCK_ORDER',
        orderId,
      } as OrderProcessingJob,
      {
        delay,
        jobId: `lock-${orderId}`,
      }
    );
  }
} 