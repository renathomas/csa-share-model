import { pgTable, uuid, integer, decimal, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { addons } from './addons';

export const orderAddons = pgTable('order_addons', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  addonId: uuid('addon_id').notNull().references(() => addons.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export type OrderAddon = typeof orderAddons.$inferSelect;
export type NewOrderAddon = typeof orderAddons.$inferInsert; 