import { pgTable, uuid, integer, time, boolean, timestamp } from 'drizzle-orm/pg-core';
import { fulfillmentTypeEnum } from './subscriptions';

export const fulfillmentSchedules = pgTable('fulfillment_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  fulfillmentType: fulfillmentTypeEnum('fulfillment_type').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  fulfillmentTime: time('fulfillment_time').notNull(),
  cutoffHoursBefore: integer('cutoff_hours_before').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export type FulfillmentSchedule = typeof fulfillmentSchedules.$inferSelect;
export type NewFulfillmentSchedule = typeof fulfillmentSchedules.$inferInsert; 