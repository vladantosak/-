import { relations } from 'drizzle-orm';
import { boolean, doublePrecision, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users Table (P2P Profile: customer, courier, master, admin)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('user'), // 'user' | 'master' | 'admin'
  rating: doublePrecision('rating').notNull().default(5.0),
  isVerified: boolean('is_verified').notNull().default(false),
  isOnline: boolean('is_online').notNull().default(true),
  avatarUrl: text('avatar_url').notNull().default(''),
  balance: doublePrecision('balance').notNull().default(1000.0), // Available balance in руб. ПМР
  reservedBalance: doublePrecision('reserved_balance').notNull().default(0.0), // Escrow-locked balance
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Orders Table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  clientId: text('client_id').references(() => users.id).notNull(),
  courierId: text('courier_id').references(() => users.id),
  category: text('category').notNull(), // 'products' | 'pharmacy' | 'auto_parts' | 'master'
  title: text('title').notNull(),
  description: text('description').notNull(),
  budget: doublePrecision('budget').notNull(), // in руб. ПМР
  city: text('city').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  address: text('address').notNull(),
  status: text('status').notNull().default('created'), // 'created' | 'accepted' | 'receipt_uploaded' | 'completed' | 'disputed' | 'canceled'
  clientRating: doublePrecision('client_rating'),
  clientReview: text('client_review'),
  courierRating: doublePrecision('courier_rating'),
  courierReview: text('courier_review'),
  disputeReason: text('dispute_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Receipts Table
export const receipts = pgTable('receipts', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull().unique(),
  photoUrl: text('photo_url').notNull(),
  totalSum: doublePrecision('total_sum').notNull(), // in руб. ПМР
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// 4. Verifications Table (Passport + Selfie moderation)
export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  passportPhotoUrl: text('passport_photo_url').notNull(),
  selfiePhotoUrl: text('selfie_photo_url').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. In-Order Chat Messages
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  senderId: text('sender_id').references(() => users.id).notNull(),
  text: text('text').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Escrow & Wallet Transactions Table
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  orderId: text('order_id').references(() => orders.id),
  type: text('type').notNull(), // 'reserve' | 'release' | 'payout' | 'fee' | 'topup' | 'refund'
  amount: doublePrecision('amount').notNull(), // in руб. ПМР
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Admin Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  targetId: text('target_id').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. In-App & Push Notifications Table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(), // 'order_created_nearby' | 'order_accepted' | 'order_status_changed' | 'chat_message' | 'system'
  title: text('title').notNull(),
  body: text('body').notNull(),
  payload: text('payload').notNull().default('{}'), // JSON encoded
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Written Customer Reviews Table
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  authorId: text('author_id').references(() => users.id).notNull(),
  targetUserId: text('target_user_id').references(() => users.id).notNull(),
  rating: doublePrecision('rating').notNull().default(5.0),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ordersCreated: many(orders, { relationName: 'clientOrders' }),
  ordersAssigned: many(orders, { relationName: 'courierOrders' }),
  verifications: many(verifications),
  transactions: many(transactions),
  notifications: many(notifications),
  reviewsReceived: many(reviews, { relationName: 'receivedReviews' }),
  reviewsWritten: many(reviews, { relationName: 'writtenReviews' }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(users, {
    fields: [orders.clientId],
    references: [users.id],
    relationName: 'clientOrders',
  }),
  courier: one(users, {
    fields: [orders.courierId],
    references: [users.id],
    relationName: 'courierOrders',
  }),
  receipt: one(receipts, {
    fields: [orders.id],
    references: [receipts.orderId],
  }),
  messages: many(messages),
  transactions: many(transactions),
  reviews: many(reviews),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  order: one(orders, {
    fields: [receipts.orderId],
    references: [orders.id],
  }),
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
  user: one(users, {
    fields: [verifications.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  order: one(orders, {
    fields: [messages.orderId],
    references: [orders.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(users, {
    fields: [auditLogs.adminId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  author: one(users, {
    fields: [reviews.authorId],
    references: [users.id],
    relationName: 'writtenReviews',
  }),
  targetUser: one(users, {
    fields: [reviews.targetUserId],
    references: [users.id],
    relationName: 'receivedReviews',
  }),
}));
