import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as bcrypt from "bcryptjs";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Authentication - Login with Password", () => {
  const testUsername = "مؤنس الطويل";
  const testPassword = "0599";
  let testUserId: number | null = null;

  beforeAll(async () => {
    // Clean up any existing test user
    const db = await getDb();
    if (db) {
      try {
        await db
          .delete(users)
          .where(eq(users.fullName, testUsername));
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  afterAll(async () => {
    // Clean up test user
    const db = await getDb();
    if (db && testUserId) {
      try {
        await db.delete(users).where(eq(users.id, testUserId));
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  it("should set password for a user", async () => {
    const db = await getDb();
    expect(db).toBeDefined();

    if (!db) {
      throw new Error("Database connection failed");
    }

    // Create a test user
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    const result = await db.insert(users).values({
      openId: `test-${testUsername.replace(/\s+/g, "-").toLowerCase()}`,
      fullName: testUsername,
      isProfileComplete: false,
      passwordHash: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the inserted user ID
    const insertedUsers = await db
      .select()
      .from(users)
      .where(eq(users.fullName, testUsername));

    expect(insertedUsers.length).toBeGreaterThan(0);
    expect(insertedUsers[0].passwordHash).toBeDefined();
    expect(insertedUsers[0].passwordHash).not.toBeNull();
    
    testUserId = insertedUsers[0].id;
  });

  it("should verify password on first login attempt", async () => {
    const db = await getDb();
    expect(db).toBeDefined();

    if (!db) {
      throw new Error("Database connection failed");
    }

    // Get the user
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.fullName, testUsername));

    expect(foundUsers.length).toBeGreaterThan(0);
    const user = foundUsers[0];

    // Verify password
    expect(user.passwordHash).toBeDefined();
    const isPasswordValid = await bcrypt.compare(testPassword, user.passwordHash!);
    expect(isPasswordValid).toBe(true);
  });

  it("should verify password on second login attempt (same password)", async () => {
    const db = await getDb();
    expect(db).toBeDefined();

    if (!db) {
      throw new Error("Database connection failed");
    }

    // Get the user again (simulating a second login)
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.fullName, testUsername));

    expect(foundUsers.length).toBeGreaterThan(0);
    const user = foundUsers[0];

    // Verify password again
    expect(user.passwordHash).toBeDefined();
    const isPasswordValid = await bcrypt.compare(testPassword, user.passwordHash!);
    expect(isPasswordValid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const db = await getDb();
    expect(db).toBeDefined();

    if (!db) {
      throw new Error("Database connection failed");
    }

    // Get the user
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.fullName, testUsername));

    expect(foundUsers.length).toBeGreaterThan(0);
    const user = foundUsers[0];

    // Verify wrong password is rejected
    expect(user.passwordHash).toBeDefined();
    const isPasswordValid = await bcrypt.compare("wrongpassword", user.passwordHash!);
    expect(isPasswordValid).toBe(false);
  });

  it("should handle passwordHash field correctly (text type)", async () => {
    const db = await getDb();
    expect(db).toBeDefined();

    if (!db) {
      throw new Error("Database connection failed");
    }

    // Get the user
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.fullName, testUsername));

    expect(foundUsers.length).toBeGreaterThan(0);
    const user = foundUsers[0];

    // Verify passwordHash is stored correctly
    expect(user.passwordHash).toBeDefined();
    expect(typeof user.passwordHash).toBe("string");
    expect(user.passwordHash!.length).toBeGreaterThan(20); // bcrypt hashes are typically 60 chars
  });
});
