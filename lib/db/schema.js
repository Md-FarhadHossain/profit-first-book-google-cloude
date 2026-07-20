import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: text('order_id').notNull().unique(),
  name: text('name').notNull(),
  number: text('number').notNull(),
  address: text('address').notNull(),
  shipping: text('shipping'),
  shippingCost: real('shipping_cost'),
  totalValue: real('total_value'),
  status: text('status').default('Processing'),
  phoneCallStatus: text('phone_call_status').default('Pending'),
  items: text('items', { mode: 'json' }),
  district: text('district'),
  thana: text('thana'),
  currency: text('currency').default('BDT'),
  postId: text('post_id'),
  postType: text('post_type'),
  clientInfo: text('client_info', { mode: 'json' }),
  marketing: text('marketing', { mode: 'json' }),
  date: text('date').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at'),
  shippedAt: text('shipped_at'),
  deliveredAt: text('delivered_at'),
  returnedAt: text('returned_at'),
  smsStatus: text('sms_status').default('Pending'),
  note: text('note'),
  consignmentId: text('consignment_id'),
  trackingCode: text('tracking_code'),
  courierStatus: text('courier_status').default('pending'),
  gender: text('gender'),
  courierNote: text('courier_note'),
  scheduledDate: text('scheduled_date')
});

export const partialOrders = sqliteTable('partial_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceId: text('device_id').notNull().unique(),
  name: text('name'),
  number: text('number'),
  address: text('address'),
  shipping: text('shipping'),
  shippingCost: real('shipping_cost'),
  totalValue: real('total_value'),
  items: text('items', { mode: 'json' }),
  district: text('district'),
  thana: text('thana'),
  currency: text('currency'),
  postId: text('post_id'),
  postType: text('post_type'),
  clientInfo: text('client_info', { mode: 'json' }),
  marketing: text('marketing', { mode: 'json' }),
  localTime: text('local_time'),
  status: text('status').default('Processing'),
  phoneCallStatus: text('phone_call_status').default('Pending'),
  date: text('date').default(sql`(CURRENT_TIMESTAMP)`)
});

export const stocks = sqliteTable('stocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  quantity: integer('quantity').default(1000),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
});

export const stockHistory = sqliteTable('stock_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: integer('amount').notNull(),
  date: text('date').default(sql`(CURRENT_TIMESTAMP)`),
  costs: text('costs', { mode: 'json' })
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  customCategory: text('custom_category'),
  note: text('note'),
  date: text('date').default(sql`(CURRENT_TIMESTAMP)`)
});

export const facebookCosts = sqliteTable('facebook_costs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dollars: real('dollars').notNull(),
  bdtRate: real('bdt_rate').notNull(),
  totalBdt: real('total_bdt').notNull(),
  date: text('date').default(sql`(CURRENT_TIMESTAMP)`)
});

export const blockedUsers = sqliteTable('blocked_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  identifier: text('identifier').notNull().unique(),
  note: text('note'),
  blockedAt: text('blocked_at').default(sql`(CURRENT_TIMESTAMP)`)
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceId: text('device_id').notNull(),
  date: text('date').default(sql`(CURRENT_TIMESTAMP)`),
  addedToCart: integer('added_to_cart', { mode: 'boolean' }).default(false),
  initiatedCheckout: integer('initiated_checkout', { mode: 'boolean' }).default(false)
});

export const steadfastHistory = sqliteTable('steadfast_history', {
  phone: text('phone').primaryKey(),
  data: text('data', { mode: 'json' }).notNull(),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
});
