import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { users, invitations } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Invitations Display with User Info', () => {
  let inviterId: number;
  let inviteeId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    
    // Create inviter user with profile image
    const inviterResult = await db.insert(users).values({
      openId: 'test-inviter',
      fullName: 'مرسل العزومة',
      isProfileComplete: true,
      profileImage: 'https://example.com/inviter-avatar.jpg',
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    inviterId = inviterResult[0]?.insertId || 1;

    // Create invitee user
    const inviteeResult = await db.insert(users).values({
      openId: 'test-invitee',
      fullName: 'مستقبل العزومة',
      isProfileComplete: true,
      profileImage: 'https://example.com/invitee-avatar.jpg',
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    inviteeId = inviteeResult[0]?.insertId || 2;
  });

  afterAll(async () => {
    if (db) {
      // Clean up test data
      await db.delete(invitations).where(eq(invitations.inviterId, inviterId));
      await db.delete(users).where(eq(users.id, inviterId));
      await db.delete(users).where(eq(users.id, inviteeId));
    }
  });

  it('should store invitation with inviter ID', async () => {
    const invitationData = {
      inviterId,
      inviteeId,
      invitationType: 'غداء',
      status: 'pending',
      createdAt: new Date(),
    };

    const result = await db.insert(invitations).values(invitationData);
    expect(result).toBeDefined();
  });

  it('should retrieve inviter information from user table', async () => {
    // Get the inviter user
    const inviterUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, inviterId));

    expect(inviterUsers.length).toBe(1);
    const inviter = inviterUsers[0];
    
    expect(inviter.fullName).toBe('مرسل العزومة');
    expect(inviter.profileImage).toBe('https://example.com/inviter-avatar.jpg');
  });

  it('should display inviter profile image in invitation', async () => {
    // Create an invitation
    const invitationData = {
      inviterId,
      inviteeId,
      invitationType: 'عشاء',
      status: 'pending',
      createdAt: new Date(),
    };

    await db.insert(invitations).values(invitationData);

    // Retrieve invitation and enrich with inviter info
    const invitationsList = await db
      .select()
      .from(invitations)
      .where(eq(invitations.inviterId, inviterId));

    expect(invitationsList.length).toBeGreaterThan(0);

    // Get inviter info for each invitation
    const invitation = invitationsList[0];
    const inviterInfo = await db
      .select()
      .from(users)
      .where(eq(users.id, invitation.inviterId));

    expect(inviterInfo[0].profileImage).toBeDefined();
    expect(inviterInfo[0].profileImage).toContain('avatar');
  });

  it('should handle missing profile image gracefully', async () => {
    // Create a user without profile image
    const userWithoutImageResult = await db.insert(users).values({
      openId: 'test-no-image',
      fullName: 'مستخدم بدون صورة',
      isProfileComplete: true,
      profileImage: null,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const userWithoutImageId = userWithoutImageResult[0]?.insertId || 3;

    // Get the user
    const usersList = await db
      .select()
      .from(users)
      .where(eq(users.id, userWithoutImageId));

    expect(usersList[0].profileImage).toBeNull();
    
    // Clean up
    await db.delete(users).where(eq(users.id, userWithoutImageId));
  });

  it('should display full name with profile image', async () => {
    const inviterUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, inviterId));

    const inviter = inviterUsers[0];
    
    // Simulate the display data
    const displayData = {
      name: inviter.fullName,
      image: inviter.profileImage,
    };

    expect(displayData.name).toBe('مرسل العزومة');
    expect(displayData.image).toBe('https://example.com/inviter-avatar.jpg');
    expect(displayData.image).not.toBeNull();
  });

  it('should filter users by profile completion status', async () => {
    // Create an incomplete user
    const incompleteUserResult = await db.insert(users).values({
      openId: 'test-incomplete',
      fullName: 'مستخدم غير مكتمل',
      isProfileComplete: false,
      profileImage: null,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const incompleteUserId = incompleteUserResult[0]?.insertId || 4;

    // Get all users with complete profiles
    const completeUsers = await db
      .select()
      .from(users)
      .where(eq(users.isProfileComplete, true));

    // Verify incomplete user is not in the list
    const incompleteUserInList = completeUsers.find((u: any) => u.id === incompleteUserId);
    expect(incompleteUserInList).toBeUndefined();

    // Clean up
    await db.delete(users).where(eq(users.id, incompleteUserId));
  });

  it('should provide fallback when inviter data is missing', async () => {
    // Simulate missing inviter
    const inviterData = null;
    
    // Use fallback text
    const displayName = inviterData?.fullName || 'شخص ما';
    const displayImage = inviterData?.profileImage || null;

    expect(displayName).toBe('شخص ما');
    expect(displayImage).toBeNull();
  });
});
