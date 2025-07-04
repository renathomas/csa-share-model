import { pgTable, uuid, varchar, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { subscriptions } from './subscriptions';
import { orders } from './orders';

export const paymentTypeEnum = pgEnum('payment_type', ['subscription', 'addon']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  paymentType: paymentTypeEnum('payment_type').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethodId: varchar('payment_method_id', { length: 255 }),
  transactionId: varchar('transaction_id', { length: 255 }),
  status: paymentStatusEnum('status').notNull().default('pending'),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert; 