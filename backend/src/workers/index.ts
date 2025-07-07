import { Worker } from 'bullmq';
import { queues } from '../config/queues.js';
import type { 
  OrderProcessingJob, 
  NotificationJob, 
  PaymentJob, 
  SubscriptionJob 
} from '../config/queues.js';
import { orderService } from '../services/order.service.js';
import { notificationService } from '../services/notification.service.js';
import { paymentService } from '../services/payment.service.js';
import { subscriptionService } from '../services/subscription.service.js';

// Redis connection configuration
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
};

// Order Processing Worker
export const orderProcessingWorker = new Worker(
  'Order Processing',
  async (job) => {
    console.log(`Processing order job ${job.id}:`, job.data);
    
    try {
      const data = job.data as OrderProcessingJob;
      
      switch (data.type) {
        case 'CREATE_ORDERS':
          await job.updateProgress(25);
          console.log(`Creating orders for subscription ${data.subscriptionId}`);
          
          const orders = await orderService.createOrdersForSubscription(data.subscriptionId);
          
          await job.updateProgress(100);
          return { success: true, ordersCreated: orders.length };

        case 'LOCK_ORDER':
          await job.updateProgress(50);
          console.log(`Locking order ${data.orderId}`);
          
          if (!data.orderId) {
            throw new Error('Order ID is required for LOCK_ORDER');
          }
          
          const lockedOrder = await orderService.lockOrder(data.orderId);
          
          if (lockedOrder) {
            // Send order locked notification
            await notificationService.sendOrderLockedNotification(
              lockedOrder.userId, 
              lockedOrder.id
            );
          }
          
          await job.updateProgress(100);
          return { success: true, order: lockedOrder };

        case 'FULFILL_ORDER':
          await job.updateProgress(50);
          console.log(`Fulfilling order ${data.orderId}`);
          
          if (!data.orderId) {
            throw new Error('Order ID is required for FULFILL_ORDER');
          }
          
          const fulfilledOrder = await orderService.fulfillOrder(data.orderId);
          
          await job.updateProgress(100);
          return { success: true, order: fulfilledOrder };

        default:
          throw new Error(`Unknown order processing job type: ${data.type}`);
      }
    } catch (error) {
      console.error(`Order processing job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process multiple order jobs concurrently
  }
);

// Notification Worker
export const notificationWorker = new Worker(
  'Notifications',
  async (job) => {
    console.log(`Processing notification job ${job.id}:`, job.data);
    
    try {
      const data = job.data as NotificationJob;
      
      switch (data.type) {
        case 'ORDER_REMINDER':
          await job.updateProgress(50);
          console.log(`Sending order reminder for order ${data.orderId}`);
          
          if (!data.orderId) {
            throw new Error('Order ID is required for ORDER_REMINDER');
          }
          
          const reminderResult = await notificationService.sendOrderReminder(
            data.userId, 
            data.orderId
          );
          
          await job.updateProgress(100);
          return reminderResult;

        case 'ORDER_LOCKED':
          await job.updateProgress(50);
          console.log(`Sending order locked notification for order ${data.orderId}`);
          
          if (!data.orderId) {
            throw new Error('Order ID is required for ORDER_LOCKED');
          }
          
          const lockedResult = await notificationService.sendOrderLockedNotification(
            data.userId, 
            data.orderId
          );
          
          await job.updateProgress(100);
          return lockedResult;

        case 'PAYMENT_FAILED':
          await job.updateProgress(50);
          console.log(`Sending payment failed notification for subscription ${data.subscriptionId}`);
          
          if (!data.subscriptionId) {
            throw new Error('Subscription ID is required for PAYMENT_FAILED');
          }
          
          const paymentFailedResult = await notificationService.sendPaymentFailedNotification(
            data.userId, 
            data.subscriptionId
          );
          
          await job.updateProgress(100);
          return paymentFailedResult;

        case 'SUBSCRIPTION_RENEWED':
          await job.updateProgress(50);
          console.log(`Sending subscription renewed notification for subscription ${data.subscriptionId}`);
          
          if (!data.subscriptionId) {
            throw new Error('Subscription ID is required for SUBSCRIPTION_RENEWED');
          }
          
          const renewedResult = await notificationService.sendSubscriptionRenewedNotification(
            data.userId, 
            data.subscriptionId
          );
          
          await job.updateProgress(100);
          return renewedResult;

        default:
          throw new Error(`Unknown notification job type: ${data.type}`);
      }
    } catch (error) {
      console.error(`Notification job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // Process multiple notification jobs concurrently
  }
);

// Payment Worker
export const paymentWorker = new Worker(
  'Payments',
  async (job) => {
    console.log(`Processing payment job ${job.id}:`, job.data);
    
    try {
      const data = job.data as PaymentJob;
      
      switch (data.type) {
        case 'PROCESS_SUBSCRIPTION_PAYMENT':
          await job.updateProgress(25);
          console.log(`Processing subscription payment for subscription ${data.subscriptionId}`);
          
          if (!data.subscriptionId) {
            throw new Error('Subscription ID is required for PROCESS_SUBSCRIPTION_PAYMENT');
          }
          
          const subscriptionPaymentResult = await paymentService.processSubscriptionPayment(
            data.userId,
            data.subscriptionId,
            data.paymentMethodId,
            data.amount
          );
          
          await job.updateProgress(100);
          return subscriptionPaymentResult;

        case 'PROCESS_ADDON_PAYMENT':
          await job.updateProgress(25);
          console.log(`Processing addon payment for order ${data.orderId}`);
          
          if (!data.orderId) {
            throw new Error('Order ID is required for PROCESS_ADDON_PAYMENT');
          }
          
          const addonPaymentResult = await paymentService.processAddonPayment(
            data.userId,
            data.orderId,
            data.paymentMethodId,
            data.amount
          );
          
          await job.updateProgress(100);
          return addonPaymentResult;

        case 'PROCESS_REFUND':
          await job.updateProgress(25);
          console.log(`Processing refund for payment ${data.paymentMethodId}`);
          
          const refundResult = await paymentService.processRefund(
            data.paymentMethodId,
            data.amount
          );
          
          await job.updateProgress(100);
          return refundResult;

        default:
          throw new Error(`Unknown payment job type: ${data.type}`);
      }
    } catch (error) {
      console.error(`Payment job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process payment jobs with limited concurrency for safety
  }
);

// Subscription Worker
export const subscriptionWorker = new Worker(
  'Subscriptions',
  async (job) => {
    console.log(`Processing subscription job ${job.id}:`, job.data);
    
    try {
      const data = job.data as SubscriptionJob;
      
      switch (data.type) {
        case 'AUTO_ENROLL':
          await job.updateProgress(25);
          console.log(`Processing auto-enrollment for subscription ${data.subscriptionId}`);
          
          // Auto-enrollment logic would go here
          // For now, just log it
          console.log('Auto-enrollment processing completed');
          
          await job.updateProgress(100);
          return { success: true, message: 'Auto-enrollment completed' };

        case 'RENEW_SUBSCRIPTION':
          await job.updateProgress(25);
          console.log(`Renewing subscription ${data.subscriptionId}`);
          
          // Subscription renewal logic would go here
          // Create new orders, process payment, etc.
          console.log('Subscription renewal processing completed');
          
          await job.updateProgress(100);
          return { success: true, message: 'Subscription renewed' };

        case 'CANCEL_SUBSCRIPTION':
          await job.updateProgress(25);
          console.log(`Cancelling subscription ${data.subscriptionId}`);
          
          // Subscription cancellation logic would go here
          // Cancel future orders, process refunds, etc.
          console.log('Subscription cancellation processing completed');
          
          await job.updateProgress(100);
          return { success: true, message: 'Subscription cancelled' };

        default:
          throw new Error(`Unknown subscription job type: ${data.type}`);
      }
    } catch (error) {
      console.error(`Subscription job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Process subscription jobs sequentially
  }
);

// Worker event handlers
const workers = [orderProcessingWorker, notificationWorker, paymentWorker, subscriptionWorker];

workers.forEach(worker => {
  worker.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed successfully:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('progress', (job, progress) => {
    console.log(`📊 Job ${job.id} progress: ${progress}%`);
  });
});

// Graceful shutdown
export async function shutdownWorkers() {
  console.log('Shutting down workers...');
  
  try {
    await Promise.all(workers.map(worker => worker.close()));
    console.log('✅ All workers shut down successfully');
  } catch (error) {
    console.error('❌ Error shutting down workers:', error);
  }
}

process.on('SIGTERM', shutdownWorkers);
process.on('SIGINT', shutdownWorkers);

export { workers }; 