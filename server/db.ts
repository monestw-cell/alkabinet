import { eq, and, desc, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  confessionMessages,
  invitations,
  weeklyPhotos,
  photoVotes,
  debts,
  embarrassingMoments,
  pesResults,
  ratings,
  anonymousTips,
  groupPhotos,
  charityArchive,
  notifications,
  type ConfessionMessage,
  type Invitation,
  type WeeklyPhoto,
  type Debt,
  type EmbarrassingMoment,
  type PesResult,
  type Rating,
  type AnonymousTip,
  type GroupPhoto,
  type CharityArchive,
  type Notification,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users);
}

export async function updateUserProfile(
  userId: number,
  data: {
    fullName?: string;
    dateOfBirth?: Date;
    profileImage?: string;
    specialization?: string;
    hobbies?: string;
    isProfileComplete?: boolean;
  }
) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

// Confession Messages
export async function createConfessionMessage(data: {
  senderId: number;
  recipientId: number;
  originalMessage: string;
  arabicMessage: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(confessionMessages).values(data);
  return result;
}

export async function getConfessionMessagesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(confessionMessages)
    .where(eq(confessionMessages.recipientId, userId))
    .orderBy(desc(confessionMessages.createdAt));
}

// Invitations
export async function createInvitation(data: {
  inviterId: number;
  inviteeId: number;
  invitationType: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(invitations).values(data);
}

export async function getInvitationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(invitations)
    .where(eq(invitations.inviteeId, userId))
    .orderBy(desc(invitations.createdAt));
}

export async function updateInvitationStatus(
  invitationId: number,
  status: "accepted" | "declined"
) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(invitations)
    .set({ status, respondedAt: new Date() })
    .where(eq(invitations.id, invitationId));
}

// Weekly Photos
export async function createWeeklyPhoto(data: {
  userId: number;
  photoUrl: string;
  week: number;
  year: number;
}) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(weeklyPhotos).values(data);
}

export async function getWeeklyPhotos(week: number, year: number) {
  const db = await getDb();
  if (!db) return [];
  
  const photos = await db
    .select()
    .from(weeklyPhotos)
    .where(and(eq(weeklyPhotos.week, week), eq(weeklyPhotos.year, year)))
    .orderBy(desc(weeklyPhotos.votes));

  // Enrich with user data and voters
  const enriched = await Promise.all(
    photos.map(async (photo: any) => {
      const uploader = await db.select().from(users).where(eq(users.id, photo.uploadedBy));
      const votes = await db.select().from(photoVotes).where(eq(photoVotes.photoId, photo.id));
      
      const voters = await Promise.all(
        votes.map(async (vote: any) => {
          const voter = await db.select().from(users).where(eq(users.id, vote.voterId));
          return voter[0];
        })
      );

      return {
        ...photo,
        uploadedByUser: uploader[0] || null,
        voters: voters.filter(Boolean),
      };
    })
  );

  return enriched;
}

export async function voteForPhoto(voterId: number, photoId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(photoVotes).values({ voterId, photoId });
  // Get current vote count and increment
  const photo = await db.select().from(weeklyPhotos).where(eq(weeklyPhotos.id, photoId)).limit(1);
  if (photo.length > 0) {
    await db
      .update(weeklyPhotos)
      .set({ votes: (photo[0].votes || 0) + 1 })
      .where(eq(weeklyPhotos.id, photoId));
  }
}

// Debts
export async function createDebt(data: {
  creditorId: number;
  debtorId: number;
  amount: string | number;
  reason?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(debts).values({
    ...data,
    amount: typeof data.amount === 'number' ? data.amount.toString() : data.amount,
  } as any);
}

export async function getDebts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(debts).orderBy(desc(debts.createdAt));
}

export async function markDebtAsPaid(debtId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(debts)
    .set({ isPaid: true, paidAt: new Date() })
    .where(eq(debts.id, debtId));
}

// Embarrassing Moments
export async function createEmbarrassingMoment(data: {
  userId: number;
  title: string;
  description: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(embarrassingMoments).values(data);
}

export async function getEmbarrassingMoments() {
  const db = await getDb();
  if (!db) return [];
  
  const moments = await db.select().from(embarrassingMoments).orderBy(desc(embarrassingMoments.createdAt));
  
  // Enrich with user data
  const enriched = await Promise.all(
    moments.map(async (moment: any) => {
      const user = await db.select().from(users).where(eq(users.id, moment.userId));
      return {
        ...moment,
        userName: user[0]?.fullName || 'مستخدم',
        userProfileImage: user[0]?.profileImage || null,
      };
    })
  );
  
  return enriched;
}

// PES Results
export async function createPesResult(data: {
  winnerId?: number;
  loserId?: number;
  didNotPlayIds?: string;
  date: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(pesResults).values(data);
}

export async function getPesResults() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(pesResults).orderBy(desc(pesResults.date));
}

// Ratings
export async function createRating(data: {
  raterId: number;
  ratedUserId: number;
  rating: number;
  comment?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(ratings).values(data);
}

export async function getAllRatings() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(ratings).orderBy(desc(ratings.createdAt));
}

export async function getRatingsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(ratings)
    .where(eq(ratings.ratedUserId, userId));
}

// Anonymous Tips
export async function createAnonymousTip(data: any) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(anonymousTips).values(data);
}

export async function getAnonymousTips() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(anonymousTips).orderBy(desc(anonymousTips.createdAt));
}

// Group Photos
export async function createGroupPhoto(data: {
  uploadedById: number;
  photoUrl: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(groupPhotos).values(data);
}

export async function getGroupPhotos() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(groupPhotos).orderBy(desc(groupPhotos.createdAt));
}

// Charity Archive
export async function createCharityEntry(data: {
  type: "dua" | "quran_verse";
  content: string;
  arabicContent?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(charityArchive).values(data);
}

export async function getCharityEntries() {
  const db = await getDb();
  if (!db) return [];
  
  const entries = await db.select().from(charityArchive).orderBy(desc(charityArchive.createdAt));
  
  // Enrich with user data
  const enriched = await Promise.all(
    entries.map(async (entry: any) => {
      const user = await db.select().from(users).where(eq(users.id, entry.userId));
      return {
        ...entry,
        userName: user[0]?.fullName || 'مستخدم',
        userProfileImage: user[0]?.profileImage || null,
      };
    })
  );
  
  return enriched;
}

// Notifications
export async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  message?: string;
  relatedUserId?: number;
  relatedItemId?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(notifications).values(data);
}

export async function getNotificationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

export async function markConfessionAsRead(messageId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(confessionMessages)
    .set({ isRead: true })
    .where(eq(confessionMessages.id, messageId));
}
