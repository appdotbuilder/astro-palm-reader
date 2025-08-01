
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

const testInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  preferred_language: 'english'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.preferred_language).toEqual('english');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].preferred_language).toEqual('english');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create user with different languages', async () => {
    const bengaliInput: CreateUserInput = {
      email: 'bengali@example.com',
      name: 'Bengali User',
      preferred_language: 'bengali'
    };

    const hindiInput: CreateUserInput = {
      email: 'hindi@example.com',
      name: 'Hindi User',
      preferred_language: 'hindi'
    };

    const bengaliUser = await createUser(bengaliInput);
    const hindiUser = await createUser(hindiInput);

    expect(bengaliUser.preferred_language).toEqual('bengali');
    expect(hindiUser.preferred_language).toEqual('hindi');
  });

  it('should throw error for duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com',
      name: 'Another User',
      preferred_language: 'hindi'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should maintain email uniqueness in database', async () => {
    // Create first user
    await createUser(testInput);

    try {
      // Try to create duplicate
      await createUser({
        email: 'test@example.com',
        name: 'Duplicate User',
        preferred_language: 'bengali'
      });
    } catch (error) {
      // Expected to fail
    }

    // Verify only one user exists with this email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, 'test@example.com'))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('Test User'); // Original user should remain
  });
});
