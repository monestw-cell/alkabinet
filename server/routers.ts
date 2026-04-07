import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
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
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";

// List of 6 members (fixed)
const MEMBERS = [
  "مؤنس الطويل",
  "عبد الرحمن سارية الطويل",
  "محمد العمصي",
  "سالم أبو ستة",
  "محمود المجايدة",
  "محمد المجايدة",
];

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
      .mutation(async ({ input }) => {
        const users = await getAllUsers();
        const user = users.find(u => u.fullName === input.username);
        
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
      .mutation(async ({ input }) => {
        const users = await getAllUsers();
        const user = users.find(u => u.fullName === input.username);
        
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

        return { success: true };
      }),

    // Get list of members for login dropdown
    getMembers: publicProcedure.query(() => MEMBERS),

    // Complete user profile
    completeProfile: protectedProcedure
      .input(z.object({
        fullName: z.string(),
        dateOfBirth: z.date(),
        profileImage: z.string().url(),
        specialization: z.string(),
        hobbies: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateUserProfile(ctx.user!.id, {
          ...input,
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
  }),

  // Confession Chat (الحنيوك - شات الاعتراف السري)
  confessions: router({
    send: protectedProcedure
      .input(z.object({
        recipientId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rewrite message in Modern Standard Arabic using AI
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "أنت مساعد متخصص في إعادة صياغة النصوص باللغة العربية الفصحى. أعد صياغة الرسالة التالية بالفصحى مع الحفاظ على المعنى الأصلي. رد فقط بالرسالة المعاد صياغتها بدون تعليقات إضافية.",
            },
            {
              role: "user",
              content: input.message,
            },
          ],
        });

        const arabicMessage = response.choices[0]?.message.content || input.message;

        const result = await createConfessionMessage({
          senderId: ctx.user!.id,
          recipientId: input.recipientId,
          originalMessage: input.message,
          arabicMessage: arabicMessage as string,
        });

        // Create notification
        await createNotification({
          userId: input.recipientId,
          type: "confession",
          title: "رسالة اعتراف جديدة من الحنيوك",
          message: arabicMessage as string,
        });

        return { success: true };
      }),

    getMessages: protectedProcedure.query(async ({ ctx }) => {
      return await getConfessionMessagesForUser(ctx.user!.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input }) => {
        await markConfessionAsRead(input.messageId);
        return { success: true };
      }),
  }),

  // Invitations (حابب تعزم حد؟)
  invitations: router({
    create: protectedProcedure
      .input(z.object({
        inviteeId: z.number(),
        invitationType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createInvitation({
          inviterId: ctx.user!.id,
          inviteeId: input.inviteeId,
          invitationType: input.invitationType,
        });

        // Create notification
        const inviter = await getUserById(ctx.user!.id);
        await createNotification({
          userId: input.inviteeId,
          type: "invitation",
          title: `${inviter?.fullName} يريد أن يعزمك`,
          message: `نوع العزومة: ${input.invitationType}`,
          relatedUserId: ctx.user!.id,
        });

        return { success: true };
      }),

    getInvitations: protectedProcedure.query(async ({ ctx }) => {
      return await getInvitationsForUser(ctx.user!.id);
    }),

    respond: protectedProcedure
      .input(z.object({
        invitationId: z.number(),
        status: z.enum(["accepted", "declined"]),
      }))
      .mutation(async ({ input }) => {
        await updateInvitationStatus(input.invitationId, input.status);
        return { success: true };
      }),
  }),

  // Weekly Photo Contest (أفضل صورة الأسبوع)
  photos: router({
    uploadWeekly: protectedProcedure
      .input(z.object({
        photoUrl: z.string().url(),
        week: z.number(),
        year: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createWeeklyPhoto({
          userId: ctx.user!.id,
          photoUrl: input.photoUrl,
          week: input.week,
          year: input.year,
        });

        // Notify all users
        const users = await getAllUsers();
        for (const user of users) {
          if (user.id !== ctx.user!.id) {
            await createNotification({
              userId: user.id,
              type: "photo_upload",
              title: "صورة جديدة لأفضل صورة الأسبوع",
              message: `${ctx.user!.fullName} رفع صورة جديدة`,
              relatedUserId: ctx.user!.id,
            });
          }
        }

        return { success: true };
      }),

    getWeekly: protectedProcedure
      .input(z.object({ week: z.number(), year: z.number() }))
      .query(async ({ input }) => {
        return await getWeeklyPhotos(input.week, input.year);
      }),

    vote: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await voteForPhoto(ctx.user!.id, input.photoId);
        return { success: true };
      }),
  }),

  // Debt Record (سجل الديون)
  debts: router({
    create: protectedProcedure
      .input(z.object({
        debtorId: z.number(),
        amount: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createDebt({
          creditorId: ctx.user!.id,
          debtorId: input.debtorId,
          amount: input.amount,
          reason: input.reason,
        });

        // Create notification
        const debtor = await getUserById(input.debtorId);
        await createNotification({
          userId: input.debtorId,
          type: "debt",
          title: "ديون جديدة",
          message: `${ctx.user!.fullName} سجل عليك دين بقيمة ${input.amount}`,
          relatedUserId: ctx.user!.id,
        });

        return { success: true };
      }),

    getAll: protectedProcedure.query(async () => {
      return await getDebts();
    }),

    markAsPaid: protectedProcedure
      .input(z.object({ debtId: z.number() }))
      .mutation(async ({ input }) => {
        await markDebtAsPaid(input.debtId);
        return { success: true };
      }),
  }),

  // Embarrassing Moments (أرشيف المواقف المحرجة)
  embarrassingMoments: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createEmbarrassingMoment({
          userId: ctx.user!.id,
          title: input.title,
          description: input.description,
        });

        // Notify all users
        const users = await getAllUsers();
        for (const user of users) {
          if (user.id !== ctx.user!.id) {
            await createNotification({
              userId: user.id,
              type: "embarrassing_moment",
              title: "موقف محرج جديد",
              message: `${ctx.user!.fullName} أضاف موقفاً محرجاً: ${input.title}`,
              relatedUserId: ctx.user!.id,
            });
          }
        }

        return { success: true };
      }),

    getAll: protectedProcedure.query(async () => {
      return await getEmbarrassingMoments();
    }),
  }),

  // PES Game Results (سجل الفوز بالبيس)
  pesResults: router({
    create: protectedProcedure
      .input(z.object({
        winnerId: z.number().optional(),
        loserId: z.number().optional(),
        didNotPlayIds: z.array(z.number()).optional(),
        date: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createPesResult({
          winnerId: input.winnerId,
          loserId: input.loserId,
          didNotPlayIds: input.didNotPlayIds ? JSON.stringify(input.didNotPlayIds) : undefined,
          date: input.date,
        });

        // Notify all users
        const users = await getAllUsers();
        for (const user of users) {
          await createNotification({
            userId: user.id,
            type: "pes_result",
            title: "نتيجة جديدة في لعبة البيس",
            message: `تم تسجيل نتيجة جديدة في ${input.date.toLocaleDateString('ar-SA')}`,
          });
        }

        return { success: true };
      }),

    getAll: protectedProcedure.query(async () => {
      return await getPesResults();
    }),
  }),

  // User Ratings (دفتر التقييم)
  ratings: router({
    create: protectedProcedure
      .input(z.object({
        ratedUserId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createRating({
          raterId: ctx.user!.id,
          ratedUserId: input.ratedUserId,
          rating: input.rating,
          comment: input.comment,
        });

        return { success: true };
      }),

    getForUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await getRatingsForUser(input.userId);
      }),
  }),

  // Anonymous Tips (صندوق النصائح المجهول)
  tips: router({
    create: publicProcedure
      .input(z.object({ tip: z.string() }))
      .mutation(async ({ input }) => {
        const result = await createAnonymousTip(input.tip);
        return { success: true };
      }),

    getAll: protectedProcedure.query(async () => {
      return await getAnonymousTips();
    }),
  }),

  // Group Photo Archive (أرشيف الصور)
  groupPhotos: router({
    upload: protectedProcedure
      .input(z.object({
        photoUrl: z.string().url(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createGroupPhoto({
          uploadedById: ctx.user!.id,
          photoUrl: input.photoUrl,
          description: input.description,
        });

        return { success: true };
      }),

    getAll: protectedProcedure.query(async () => {
      return await getGroupPhotos();
    }),
  }),

  // Charity Archive (الصدقة الجارية)
  charity: router({
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["dua", "quran_verse"]),
        content: z.string(),
        arabicContent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createCharityEntry({
          type: input.type,
          content: input.content,
          arabicContent: input.arabicContent,
        });

        return { success: true };
      }),

    getAll: protectedProcedure.query(async () => {
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
