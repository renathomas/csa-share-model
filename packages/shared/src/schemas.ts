import { z } from 'zod';
import { 
  BoxSize, 
  FulfillmentType, 
  PaymentInterval, 
  SubscriptionStatus, 
  OrderStatus, 
  PaymentStatus,
  PaymentType,
  NotificationType,
  NotificationStatus
} from './types.js';

// Base schemas
export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
  address: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
  address: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Subscription schemas
export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  boxSize: z.nativeEnum(BoxSize),
  fulfillmentType: z.nativeEnum(FulfillmentType),
  paymentInterval: z.nativeEnum(PaymentInterval),
  boxPrice: z.number().positive(),
  totalOrders: z.number().positive(),
  remainingOrders: z.number().min(0),
  status: z.nativeEnum(SubscriptionStatus),
  periodStart: z.date(),
  periodEnd: z.date(),
  stripeSubscriptionId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const createSubscriptionSchema = z.object({
  boxSize: z.nativeEnum(BoxSize),
  fulfillmentType: z.nativeEnum(FulfillmentType),
  paymentInterval: z.nativeEnum(PaymentInterval),
  paymentMethodId: z.string().min(1)
});

export const updateSubscriptionSchema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  notes: z.string().optional()
});

// Order schemas
export const orderSchema = z.object({
  id: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  userId: z.string().uuid(),
  fulfillmentDate: z.date(),
  fulfillmentTime: z.string(),
  cutoffDatetime: z.date(),
  status: z.nativeEnum(OrderStatus),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const createOrderSchema = z.object({
  subscriptionId: z.string().uuid(),
  notes: z.string().optional(),
  addons: z.array(z.object({
    addonId: z.string().uuid(),
    quantity: z.number().positive()
  })).optional()
});

export const updateOrderSchema = z.object({
  notes: z.string().optional(),
  addons: z.array(z.object({
    addonId: z.string().uuid(),
    quantity: z.number().positive()
  })).optional()
});

// Addon schemas
export const addonSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  available: z.boolean(),
  imageUrl: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const createAddonSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  available: z.boolean().default(true),
  imageUrl: z.string().url().optional()
});

export const updateAddonSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  available: z.boolean().optional(),
  imageUrl: z.string().url().optional()
});

// Payment schemas
export const paymentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  paymentType: z.nativeEnum(PaymentType),
  amount: z.number().positive(),
  paymentMethodId: z.string().optional(),
  transactionId: z.string().optional(),
  status: z.nativeEnum(PaymentStatus),
  stripePaymentIntentId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Notification schemas
export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  type: z.nativeEnum(NotificationType),
  message: z.string().min(1),
  status: z.nativeEnum(NotificationStatus),
  scheduledAt: z.date(),
  sentAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Fulfillment schedule schemas
export const fulfillmentScheduleSchema = z.object({
  id: z.string().uuid(),
  fulfillmentType: z.nativeEnum(FulfillmentType),
  dayOfWeek: z.number().min(0).max(6),
  fulfillmentTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  cutoffHoursBefore: z.number().positive(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const createFulfillmentScheduleSchema = z.object({
  fulfillmentType: z.nativeEnum(FulfillmentType),
  dayOfWeek: z.number().min(0).max(6),
  fulfillmentTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  cutoffHoursBefore: z.number().positive(),
  active: z.boolean().default(true)
});

// API Response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional()
});

export const paginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number().positive(),
    limit: z.number().positive(),
    total: z.number().min(0),
    totalPages: z.number().min(0)
  })
});

// Query parameter schemas
export const paginationQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20)
});

export const orderQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(OrderStatus).optional(),
  userId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional()
});

export const subscriptionQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  userId: z.string().uuid().optional()
});

export const paymentQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(PaymentStatus).optional(),
  userId: z.string().uuid().optional(),
  paymentType: z.nativeEnum(PaymentType).optional()
});

// Job schemas
export const orderCutoffJobSchema = z.object({
  orderId: z.string().uuid(),
  cutoffDatetime: z.date()
});

export const notificationJobSchema = z.object({
  notificationId: z.string().uuid(),
  userId: z.string().uuid(),
  message: z.string().min(1),
  type: z.nativeEnum(NotificationType)
});

export const autoEnrollmentJobSchema = z.object({
  subscriptionId: z.string().uuid(),
  userId: z.string().uuid()
});

export const paymentProcessingJobSchema = z.object({
  paymentId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  amount: z.number().positive(),
  paymentMethodId: z.string().min(1)
});

// Export type inference helpers
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type CreateSubscriptionRequest = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionRequest = z.infer<typeof updateSubscriptionSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type UpdateOrderRequest = z.infer<typeof updateOrderSchema>;
export type CreateAddonRequest = z.infer<typeof createAddonSchema>;
export type UpdateAddonRequest = z.infer<typeof updateAddonSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
export type SubscriptionQuery = z.infer<typeof subscriptionQuerySchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>; 