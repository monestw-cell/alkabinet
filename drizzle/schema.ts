import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  datetime,
  longtext,
  tinyint
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Profile fields
  fullName: varchar("fullName", { length: 255 }),
  dateOfBirth: datetime("dateOfBirth"),
  profileImage: text("profileImage"), // S3 URL
  specialization: varchar("specialization", { length: 255 }),
  hobbies: text("hobbies"), // JSON array
  isProfileComplete: boolean("isProfileComplete").default(false),
  
  // Password field (for custom login)
  passwordHash: text("passwordHash"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Confession Chat Messages (الحنيوك - شات الاعتراف السري)
export const confessionMessages = mysqlTable("confessionMessages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  originalMessage: longtext("originalMessage").notNull(),
  arabicMessage: longtext("arabicMessage").notNull(), // Rewritten in Modern Standard Arabic
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConfessionMessage = typeof confessionMessages.$inferSelect;
export type InsertConfessionMessage = typeof confessionMessages.$inferInsert;

// Invitations (حابب تعزم حد؟)
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  inviterId: int("inviterId").notNull(),
  inviteeId: int("inviteeId").notNull(),
  invitationType: varchar("invitationType", { length: 255 }).notNull(), // Type of invitation
  status: mysqlEnum("status", ["pending", "accepted", "declined"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

// Weekly Photo Contest (أفضل صورة الأسبوع)
export const weeklyPhotos = mysqlTable("weeklyPhotos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  photoUrl: text("photoUrl").notNull(), // S3 URL
  week: int("week").notNull(), // Week number
  year: int("year").notNull(),
  votes: int("votes").default(0),
  isWinner: boolean("isWinner").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeeklyPhoto = typeof weeklyPhotos.$inferSelect;
export type InsertWeeklyPhoto = typeof weeklyPhotos.$inferInsert;

// Photo Votes
export const photoVotes = mysqlTable("photoVotes", {
  id: int("id").autoincrement().primaryKey(),
  voterId: int("voterId").notNull(),
  photoId: int("photoId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PhotoVote = typeof photoVotes.$inferSelect;
export type InsertPhotoVote = typeof photoVotes.$inferInsert;

// Debt Record (سجل الديون)
export const debts = mysqlTable("debts", {
  id: int("id").autoincrement().primaryKey(),
  creditorId: int("creditorId").notNull(), // Person who lent money
  debtorId: int("debtorId").notNull(), // Person who owes money
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  isPaid: boolean("isPaid").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  paidAt: timestamp("paidAt"),
});

export type Debt = typeof debts.$inferSelect;
export type InsertDebt = typeof debts.$inferInsert;

// Embarrassing Moments Archive (أرشيف المواقف المحرجة)
export const embarrassingMoments = mysqlTable("embarrassingMoments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: longtext("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmbarrassingMoment = typeof embarrassingMoments.$inferSelect;
export type InsertEmbarrassingMoment = typeof embarrassingMoments.$inferInsert;

// PES Game Results (سجل الفوز بالبيس)
export const pesResults = mysqlTable("pesResults", {
  id: int("id").autoincrement().primaryKey(),
  winnerId: int("winnerId"),
  loserId: int("loserId"),
  didNotPlayIds: text("didNotPlayIds"), // JSON array of user IDs
  date: datetime("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PesResult = typeof pesResults.$inferSelect;
export type InsertPesResult = typeof pesResults.$inferInsert;

// User Ratings (دفتر التقييم)
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  raterId: int("raterId").notNull(),
  ratedUserId: int("ratedUserId").notNull(),
  rating: tinyint("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

// Anonymous Tips (صندوق النصائح المجهول)
export const anonymousTips = mysqlTable("anonymousTips", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderProfileImage: text("senderProfileImage"),
  recipientId: int("recipientId").notNull(),
  content: longtext("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnonymousTip = typeof anonymousTips.$inferSelect;
export type InsertAnonymousTip = typeof anonymousTips.$inferInsert;

// Group Photo Archive (أرشيف الصور)
export const groupPhotos = mysqlTable("groupPhotos", {
  id: int("id").autoincrement().primaryKey(),
  uploadedById: int("uploadedById").notNull(),
  photoUrl: text("photoUrl").notNull(), // S3 URL
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GroupPhoto = typeof groupPhotos.$inferSelect;
export type InsertGroupPhoto = typeof groupPhotos.$inferInsert;

// Charity/Dua Archive (الصدقة الجارية)
export const charityArchive = mysqlTable("charityArchive", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["dua", "quran_verse"]).notNull(),
  content: longtext("content").notNull(),
  arabicContent: longtext("arabicContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CharityArchive = typeof charityArchive.$inferSelect;
export type InsertCharityArchive = typeof charityArchive.$inferInsert;

// Notifications (نظام الإشعارات)
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // confession, invitation, photo_vote, etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  relatedUserId: int("relatedUserId"),
  relatedItemId: int("relatedItemId"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
