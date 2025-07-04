// Export all tables
export * from './users';
export * from './subscriptions';
export * from './orders';
export * from './addons';
export * from './order-addons';
export * from './payments';
export * from './notifications';
export * from './fulfillment-schedules';

// Export relations
import { relations } from 'drizzle-orm';
import { users } from './users';
import { subscriptions } from './subscriptions';
import { orders } from './orders';
import { addons } from './addons';
import { orderAddons } from './order-addons';
import { payments } from './payments';
import { notifications } from './notifications';

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  orders: many(orders),
  payments: many(payments),
  notifications: many(notifications)
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id]
  }),
  orders: many(orders),
  payments: many(payments)
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [orders.subscriptionId],
    references: [subscriptions.id]
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  }),
  orderAddons: many(orderAddons),
  payments: many(payments),
  notifications: many(notifications)
}));

export const addonsRelations = relations(addons, ({ many }) => ({
  orderAddons: many(orderAddons)
}));

export const orderAddonsRelations = relations(orderAddons, ({ one }) => ({
  order: one(orders, {
    fields: [orderAddons.orderId],
    references: [orders.id]
  }),
  addon: one(addons, {
    fields: [orderAddons.addonId],
    references: [addons.id]
  })
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id]
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id]
  }),
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id]
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  }),
  order: one(orders, {
    fields: [notifications.orderId],
    references: [orders.id]
  })
})); 