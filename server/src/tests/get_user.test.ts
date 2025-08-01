
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateUserInput } from '../schema';
import { getUser } from '../handlers/get_user';

describe('getUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when found', async () => {
    // Create test user
    const testUser: CreateUserInput = {
      email: 'test@example.com',
      name: 'Test User',
      preferred_language: 'english'
    };

    const insertResult = await db
      .insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const createdUser = insertResult[0];

    // Test getting the user
    const result = await getUser(createdUser.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.email).toEqual('test@example.com');
    expect(result!.name).toEqual('Test User');
    expect(result!.preferred_language).toEqual('english');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user not found', async () => {
    const result = await getUser(999);
    expect(result).toBeNull();
  });

  it('should handle user with different language preference', async () => {
    // Create user with hindi preference
    const testUser: CreateUserInput = {
      email: 'hindi@example.com',
      name: 'Hindi User',
      preferred_language: 'hindi'
    };

    const insertResult = await db
      .insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const createdUser = insertResult[0];

    // Test getting the user
    const result = await getUser(createdUser.id);

    expect(result).not.toBeNull();
    expect(result!.preferred_language).toEqual('hindi');
    expect(result!.name).toEqual('Hindi User');
  });

  it('should verify user exists in database', async () => {
    // Create test user
    const testUser: CreateUserInput = {
      email: 'verify@example.com',
      name: 'Verify User',
      preferred_language: 'bengali'
    };

    const insertResult = await db
      .insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const createdUser = insertResult[0];

    // Get user through handler
    const result = await getUser(createdUser.id);

    // Verify it matches what's in database
    const dbUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(result).not.toBeNull();
    expect(dbUsers).toHaveLength(1);
    expect(result!.id).toEqual(dbUsers[0].id);
    expect(result!.email).toEqual(dbUsers[0].email);
    expect(result!.preferred_language).toEqual('bengali');
  });
});
