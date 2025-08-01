
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Test user data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  preferred_language: 'english'
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;

  beforeEach(async () => {
    // Create a test user before each test
    const result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = result[0].id;
  });

  it('should update user email', async () => {
    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'updated@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.email).toEqual('updated@example.com');
    expect(result.name).toEqual('Test User'); // Should remain unchanged
    expect(result.preferred_language).toEqual('english'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update user name', async () => {
    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Updated Name'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.name).toEqual('Updated Name');
    expect(result.preferred_language).toEqual('english'); // Should remain unchanged
  });

  it('should update user preferred language', async () => {
    const updateInput: UpdateUserInput = {
      id: userId,
      preferred_language: 'bengali'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.name).toEqual('Test User'); // Should remain unchanged
    expect(result.preferred_language).toEqual('bengali');
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'multi@example.com',
      name: 'Multi Update',
      preferred_language: 'hindi'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.email).toEqual('multi@example.com');
    expect(result.name).toEqual('Multi Update');
    expect(result.preferred_language).toEqual('hindi');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'saved@example.com',
      name: 'Saved User'
    };

    await updateUser(updateInput);

    // Verify changes were persisted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('saved@example.com');
    expect(users[0].name).toEqual('Saved User');
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    const originalTimestamp = originalUser[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Timestamp Test'
    };

    const result = await updateUser(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999,
      name: 'Non-existent User'
    };

    expect(updateUser(updateInput)).rejects.toThrow(/user with id 99999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const updateInput: UpdateUserInput = {
      id: userId
    };

    const result = await updateUser(updateInput);

    // Should return user with updated timestamp but no other changes
    expect(result.id).toEqual(userId);
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.preferred_language).toEqual('english');
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
