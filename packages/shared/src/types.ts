// Enums
export enum BoxSize {
  SMALL = 'small',
  LARGE = 'large'
}

export enum FulfillmentType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup'
}

export enum PaymentInterval {
  FOUR_WEEKS = 4,
  EIGHT_WEEKS = 8,
  TWELVE_WEEKS = 12
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum OrderStatus {
  PENDING = 'pending',
  LOCKED = 'locked',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  ADDON = 'addon'
}

export enum NotificationType {
  ORDER_REMINDER = 'order_reminder',
  ORDER_LOCKED = 'order_locked',
  PAYMENT_DUE = 'payment_due',
  PAYMENT_FAILED = 'payment_failed',
  SUBSCRIPTION_RENEWED = 'subscription_renewed'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed'
}

// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  phone?: string;
  address?: string;
  hashedPassword?: string;
  stripeCustomerId?: string;
}

export interface Subscription extends BaseEntity {
  userId: string;
  boxSize: BoxSize;
  fulfillmentType: FulfillmentType;
  paymentInterval: PaymentInterval;
  boxPrice: number;
  totalOrders: number;
  remainingOrders: number;
  status: SubscriptionStatus;
  periodStart: Date;
  periodEnd: Date;
  stripeSubscriptionId?: string;
  // Relations
  user?: User;
  orders?: Order[];
}

export interface Order extends BaseEntity {
  subscriptionId: string;
  userId: string;
  fulfillmentDate: Date;
  fulfillmentTime: string;
  cutoffDatetime: Date;
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  // Relations
  subscription?: Subscription;
  user?: User;
  addons?: OrderAddon[];
}

export interface Addon extends BaseEntity {
  name: string;
  description?: string;
  price: number;
  available: boolean;
  imageUrl?: string;
  // Relations
  orderAddons?: OrderAddon[];
}

export interface OrderAddon extends BaseEntity {
  orderId: string;
  addonId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  // Relations
  order?: Order;
  addon?: Addon;
}

export interface Payment extends BaseEntity {
  userId: string;
  subscriptionId?: string;
  orderId?: string;
  paymentType: PaymentType;
  amount: number;
  paymentMethodId?: string;
  transactionId?: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  // Relations
  user?: User;
  subscription?: Subscription;
  order?: Order;
}

export interface Notification extends BaseEntity {
  userId: string;
  orderId?: string;
  type: NotificationType;
  message: string;
  status: NotificationStatus;
  scheduledAt: Date;
  sentAt?: Date;
  // Relations
  user?: User;
  order?: Order;
}

export interface FulfillmentSchedule extends BaseEntity {
  fulfillmentType: FulfillmentType;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  fulfillmentTime: string; // HH:MM format
  cutoffHoursBefore: number;
  active: boolean;
}

// API Request/Response types - these are now generated from Zod schemas in schemas.ts

export interface AuthResponse {
  user: Omit<User, 'hashedPassword'>;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Job types
export interface OrderCutoffJob {
  orderId: string;
  cutoffDatetime: Date;
}

export interface NotificationJob {
  notificationId: string;
  userId: string;
  message: string;
  type: NotificationType;
}

export interface AutoEnrollmentJob {
  subscriptionId: string;
  userId: string;
}

export interface PaymentProcessingJob {
  paymentId: string;
  subscriptionId?: string;
  orderId?: string;
  amount: number;
  paymentMethodId: string;
}

// Configuration types
export interface CSAConfig {
  boxSizes: Array<{
    size: BoxSize;
    name: string;
    description: string;
    price: number;
  }>;
  fulfillmentOptions: Array<{
    type: FulfillmentType;
    name: string;
    description: string;
    schedules: FulfillmentSchedule[];
  }>;
  paymentIntervals: Array<{
    weeks: PaymentInterval;
    name: string;
    description: string;
    discount?: number;
  }>;
} 