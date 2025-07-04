import { pgTable, uuid, varchar, integer, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const boxSizeEnum = pgEnum('box_size', ['small', 'large']);
export const fulfillmentTypeEnum = pgEnum('fulfillment_type', ['delivery', 'pickup']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'paused', 'completed', 'cancelled']);

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  boxSize: boxSizeEnum('box_size').notNull(),
  fulfillmentType: fulfillmentTypeEnum('fulfillment_type').notNull(),
  paymentInterval: integer('payment_interval').notNull(),
  boxPrice: decimal('box_price', { precision: 10, scale: 2 }).notNull(),
  totalOrders: integer('total_orders').notNull(),
  remainingOrders: integer('remaining_orders').notNull(),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert; 