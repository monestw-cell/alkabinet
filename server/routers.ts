import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, desc, asc } from "drizzle-orm";
import { 
  getUserByOpenId, 
  getUserById, 
  getAllUsers, 
  updateUserProfile,
  updateUserPassword,
  createConfessionMessage,
  getConfessionMessagesForUser,
  createInvitation,
  getInvitationsForUser,
  updateInvitationStatus,
  createWeeklyPhoto,
  getWeeklyPhotos,
  voteForPhoto,
  createDebt,
  getDebts,
  markDebtAsPaid,
  createEmbarrassingMoment,
  getEmbarrassingMoments,
  createPesResult,
  getPesResults,
  createRating,
  getAllRatings,
  getRatingsForUser,
  createAnonymousTip,
  getAnonymousTips,
  createGroupPhoto,
  getGroupPhotos,
  createCharityEntry,
  getCharityEntries,
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  markConfessionAsRead,
} from "./db";
import { confessionMessages, anonymousTips } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { storagePut } from './storage';
import { Buffer } from 'buffer';

// List of 6 members (fixed)
const MEMBERS = [
  "مؤنس وائل الطويل",
  "عبد الرحمن سارية",
  "محمد العمصي",
  "سالم أبو ستة",
  "محمود المجايدة",
  "محمد المجايدة",
];

// Initialize members in database on startup
(async () => {
  try {
    console.log("[Init] Starting member initialization...");
    const allUsers = await getAllUsers();
    console.log(`[Init] Found ${allUsers.length} existing users`);
    const existingNames = new Set(allUsers.map(u => u.fullName).filter(Boolean));
    console.log(`[Init] Existing names: ${Array.from(existingNames).join(", ")}`);
    
    for (const memberName of MEMBERS) {
      if (!existingNames.has(memberName)) {
        console.log(`[Init] Creating user: ${memberName}`);
        const db = await getDb();
        if (db) {
          try {
            await db.insert(users).values({
              openId: `member-${memberName.replace(/\s+/g, '-').toLowerCase()}`,
              fullName: memberName,
              isProfileComplete: false,
              passwordHash: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            console.log(`[Init] ✓ Created user: ${memberName}`);
          } catch (e) {
            console.error(`[Init] Error creating user ${memberName}:`, e);
          }
        } else {
          console.warn(`[Init] Database not available for user: ${memberName}`);
        }
      } else {
        console.log(`[Init] User already exists: ${memberName}`);
      }
    }
    console.log("[Init] Member initialization complete");
  } catch (error) {
    console.error("[Init] Failed to initialize members:", error);
  }
})();

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    // Custom login with username and password
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const allUsers = await getAllUsers();
        const user = allUsers.find(u => u.fullName === input.username);
        
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "اسم المستخدم أو كلمة السر غير صحيحة",
          });
        }

        if (!user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "لم يتم تعيين كلمة سر بعد",
          });
        }

        const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "اسم المستخدم أو كلمة السر غير صحيحة",
          });
        }

        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId || `custom-${user.id}`, {
          name: user.fullName || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return {
          success: true,
          user,
        };
      }),

    // Set initial password for new users
    setPassword: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const allUsers = await getAllUsers();
        const user = allUsers.find(u => u.fullName === input.username);
        
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "المستخدم غير موجود",
          });
        }

        if (user.passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "تم تعيين كلمة السر بالفعل",
          });
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);
        await updateUserPassword(user.id, hashedPassword);

        // Create session token after setting password
        const sessionToken = await sdk.createSessionToken(user.openId || `custom-${user.id}`, {
          name: user.fullName || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true };
      }),

    // Get list of members for login dropdown
    getMembers: publicProcedure.query(() => MEMBERS),

    // Complete user profile
    completeProfile: protectedProcedure
      .input(z.object({
        fullName: z.string(),
        dateOfBirth: z.date(),
        profileImage: z.string(), // Can be base64 or URL
        specialization: z.string(),
        hobbies: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "يجب تسجيل الدخول أولاً",
          });
        }

        let profileImageUrl = input.profileImage;

        // If it's a base64 data URL, convert and upload to S3
        if (input.profileImage.startsWith('data:')) {
          try {
            const base64Data = input.profileImage.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const result = await storagePut(
              `profiles/${ctx.user.id}-profile-${Date.now()}.jpg`,
              buffer,
              'image/jpeg'
            );
            profileImageUrl = result.url;
          } catch (error) {
            console.error('[Storage] Failed to upload profile image:', error);
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'فشل رفع الصورة الشخصية',
            });
          }
        }

        await updateUserProfile(ctx.user.id, {
          fullName: input.fullName,
          dateOfBirth: input.dateOfBirth,
          profileImage: profileImageUrl,
          specialization: input.specialization,
          hobbies: input.hobbies,
          isProfileComplete: true,
        });

        return { success: true };
      }),

    // Get all users with their profiles
    getAllUsers: protectedProcedure.query(async () => {
      return await getAllUsers();
    }),

    // Get user by ID
    getUserById: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await getUserById(input.userId);
      }),

    // Update user profile
    updateProfile: protectedProcedure
      .input(z.object({
        fullName: z.string(),
        dateOfBirth: z.date(),
        profileImage: z.string(),
        specialization: z.string(),
        hobbies: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "يجب تسجيل الدخول أولاً",
          });
        }

        let profileImageUrl = input.profileImage;

        // If it's a base64 data URL, convert and upload to S3
        if (input.profileImage.startsWith('data:')) {
          try {
            const base64Data = input.profileImage.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const result = await storagePut(
              `profiles/${ctx.user.id}-profile-${Date.now()}.jpg`,
              buffer,
              'image/jpeg'
            );
            profileImageUrl = result.url;
          } catch (error) {
            console.error('[Storage] Failed to upload profile image:', error);
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'فشل رفع الصورة الشخصية',
            });
          }
        }

        await updateUserProfile(ctx.user.id, {
          fullName: input.fullName,
          dateOfBirth: input.dateOfBirth,
          profileImage: profileImageUrl,
          specialization: input.specialization,
          hobbies: input.hobbies,
        });

        return { success: true };
      }),
  }),

    // Confession Chat (الحنيوك - شات الاعتراف السري)
  confessions: router({
    send: protectedProcedure
      .input(z.object({
        message: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rewrite message in Modern Standard Arabic using AI
        let reformattedMessage = input.message;
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "أنت مساعد متخصص في إعادة صياغة النصوص باللغة العربية الفصحى لإخفاء الهوية الكتابية. أعد صياغة الرسالة التالية بالفصحى مع تغيير الأسلوب تماماً لإخفاء هوية الكاتب. رد فقط بالرسالة المعاد صياغتها بدون تعليقات إضافية.",
              },
              {
                role: "user",
                content: input.message,
              },
            ],
          });
          reformattedMessage = (typeof response.choices[0]?.message.content === 'string' ? response.choices[0]?.message.content : input.message) || input.message;
        } catch (e) {
          console.error("[LLM] Failed to rewrite message:", e);
        }

        const result = await createConfessionMessage({
          senderId: ctx.user!.id,
          recipientId: 0, // Group chat - no specific recipient
          originalMessage: input.message,
          arabicMessage: reformattedMessage,
        });

        // Create notification for all members
        try {
          const allUsers = await getAllUsers();
          for (const user of allUsers) {
            if (user.id !== ctx.user!.id && user.isProfileComplete) {
              await createNotification({
                userId: user.id,
                type: "confession",
                title: "رسالة اعتراف جديدة",
                message: "تلقيت رسالة اعتراف سرية جديدة في الشات الجماعي",
              });
            }
          }
        } catch (e) {
          console.error("[Notification] Failed to create notifications:", e);
        }

        return result;
      }),

    getMessages: protectedProcedure.query(async () => {
      // Get all confession messages for the group chat
      const db = await getDb();
      if (!db) return [];
      
      const messages = await db.select().from(confessionMessages).orderBy(desc(confessionMessages.createdAt));
      return messages.map(msg => ({
        ...msg,
        reformattedMessage: msg.arabicMessage || msg.originalMessage,
      }));
    }),

    getForUser: protectedProcedure.query(async ({ ctx }) => {
      return await getConfessionMessagesForUser(ctx.user!.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input }) => {
        await markConfessionAsRead(input.messageId);
        return { success: true };
      }),
  }),

    // Invitations (العزومات - حابب تعزم حد؟)
  invitations: router({
    create: protectedProcedure
      .input(z.object({
        invitedUserId: z.number(),
        occasion: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createInvitation({
          inviterId: ctx.user!.id,
          inviteeId: input.invitedUserId,
          invitationType: input.occasion,
        });

        // Create notification
        try {
          await createNotification({
            userId: input.invitedUserId,
            type: "invitation",
            title: "عزومة جديدة",
            message: `تلقيت عزومة: ${input.occasion}`,
          });
        } catch (e) {
          console.error("[Notification] Failed to create notification:", e);
        }

        return result;
      }),

    getForUser: protectedProcedure.query(async ({ ctx }) => {
      return await getInvitationsForUser(ctx.user!.id);
    }),

    updateStatus: protectedProcedure
      .input(z.object({
        invitationId: z.number(),
        status: z.enum(["accepted", "declined"]),
      }))
      .mutation(async ({ input }) => {
        await updateInvitationStatus(input.invitationId, input.status);
        return { success: true };
      }),
  }),

    // Weekly Photos (أفضل صورة الأسبوع)
  photos: router({
    uploadWeekly: protectedProcedure
      .input(z.object({
        photoUrl: z.string(),
        week: z.number(),
        year: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        let photoUrl = input.photoUrl;
        
        // If it's a base64 string, upload to S3
        if (input.photoUrl.startsWith('data:image')) {
          try {
            const base64Data = input.photoUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const mimeType = input.photoUrl.split(';')[0].replace('data:', '');
            const fileKey = `photos/${ctx.user!.id}-${Date.now()}.jpg`;
            const result = await storagePut(fileKey, buffer, mimeType);
            photoUrl = result.url;
          } catch (e) {
            console.error('Error uploading to S3:', e);
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'فشل رفع الصورة' });
          }
        }
        
        const result = await createWeeklyPhoto({
          userId: ctx.user!.id,
          photoUrl,
          week: input.week,
          year: input.year,
        });

        return result;
      }),

    getWeekly: publicProcedure
      .input(z.object({
        week: z.number(),
        year: z.number(),
      }))
      .query(async ({ input }) => {
        const photos = await getWeeklyPhotos(input.week, input.year);
        
        // Enrich photos with uploader info
        const enrichedPhotos = await Promise.all(
          photos.map(async (photo: any) => {
            const uploader = await getUserById(photo.userId);
            return {
              ...photo,
              uploadedByUser: uploader ? {
                id: uploader.id,
                fullName: uploader.fullName || uploader.name,
                profileImage: uploader.profileImage,
              } : null,
            };
          })
        );
        
        return enrichedPhotos;
      }),

    vote: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await voteForPhoto(input.photoId, ctx.user!.id);
        return { success: true };
      }),
  }),

    // Debts (سجل الديون)
  debts: router({
    create: protectedProcedure
      .input(z.object({
        creditorId: z.number(),
        debtorId: z.number(),
        amount: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await createDebt({
          creditorId: input.creditorId,
          debtorId: input.debtorId,
          amount: input.amount,
          reason: input.reason,
        });

        return result;
      }),

    getAll: publicProcedure.query(async () => {
      return await getDebts();
    }),

    markAsPaid: protectedProcedure
      .input(z.object({ debtId: z.number() }))
      .mutation(async ({ input }) => {
        await markDebtAsPaid(input.debtId);
        return { success: true };
      }),
  }),

    // Embarrassing Moments (المواقف المحرجة)
  moments: router({
    create: protectedProcedure
      .input(z.object({ description: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const result = await createEmbarrassingMoment({
          userId: ctx.user!.id,
          title: "موقف محرج",
          description: input.description,
        });

        return result;
      }),

    getAll: publicProcedure.query(async () => {
      return await getEmbarrassingMoments();
    }),
  }),

  // PES Results (سجل البيس)
  pes: router({
    recordResult: protectedProcedure
      .input(z.object({
        winnerId: z.number(),
        loserId: z.number(),
        notPlayedId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createPesResult({
          winnerId: input.winnerId,
          loserId: input.loserId,
          didNotPlayIds: input.notPlayedId ? JSON.stringify([input.notPlayedId]) : undefined,
          date: new Date(),
        });

        return result;
      }),

    getResults: publicProcedure.query(async () => {
      return await getPesResults();
    }),
  }),

    // Ratings (دفتر التقييم)
  ratings: router({
    create: protectedProcedure
      .input(z.object({
        ratedUserId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createRating({
          ratedUserId: input.ratedUserId,
          raterId: ctx.user!.id,
          rating: input.rating,
          comment: input.comment,
        });

        return result;
      }),

    getForUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await getRatingsForUser(input.userId);
      }),

    getAll: publicProcedure.query(async () => {
      return await getAllRatings();
    }),
  }),

  // Anonymous Tips (صندوق النصائح)
  tips: router({
    create: protectedProcedure
      .input(z.object({ 
        recipientId: z.number(),
        content: z.string() 
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        
        const sender = await getUserById(ctx.user!.id);
        
        const result = await db.insert(anonymousTips).values({
          senderId: ctx.user!.id,
          senderName: sender?.fullName || sender?.name || 'مجهول',
          senderProfileImage: sender?.profileImage || '',
          recipientId: input.recipientId,
          content: input.content,
          createdAt: new Date(),
        });

        try {
          await createNotification({
            userId: input.recipientId,
            type: 'tip',
            title: 'نصيحة جديدة',
            message: `تلقيت نصيحة جديدة من ${sender?.fullName || sender?.name || 'صديق'}`,
          });
        } catch (e) {
          console.error('[Notification] Failed to create notification:', e);
        }

        return result;
      }),

    getForUser: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      
      return await db
        .select()
        .from(anonymousTips)
        .where(eq(anonymousTips.recipientId, ctx.user!.id))
        .orderBy(desc(anonymousTips.createdAt));
    }),

    getAll: publicProcedure.query(async () => {
      return await getAnonymousTips();
    }),
  }),

  // Gallery (أرشيف الصور)
  gallery: router({
    upload: protectedProcedure
      .input(z.object({ imageUrl: z.string().url() }))
      .mutation(async ({ input, ctx }) => {
        const result = await createGroupPhoto({
          uploadedById: ctx.user!.id,
          photoUrl: input.imageUrl,
        });

        return result;
      }),

    getAll: publicProcedure.query(async () => {
      return await getGroupPhotos();
    }),
  }),

  // Charity Archive (الصدقة الجارية)
  charity: router({
    create: publicProcedure
      .input(z.object({
        type: z.enum(["dua", "quran_verse"]),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await createCharityEntry({
          type: input.type,
          content: input.content,
        });

        return result;
      }),

    getAll: publicProcedure.query(async () => {
      return await getCharityEntries();
    }),
  }),

  // Notifications
  notifications: router({
    getForUser: protectedProcedure.query(async ({ ctx }) => {
      return await getNotificationsForUser(ctx.user!.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationAsRead(input.notificationId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
