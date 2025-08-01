
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, palmReadingsTable } from '../db/schema';
import { type GetUserReadingsInput } from '../schema';
import { getUserPalmReadings } from '../handlers/get_user_palm_readings';

describe('getUserPalmReadings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch palm readings for a user', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        preferred_language: 'english'
      })
      .returning()
      .execute();

    const userId = user[0].id;

    // Create first palm reading
    await db.insert(palmReadingsTable)
      .values({
        user_id: userId,
        image_url: 'https://example.com/palm1.jpg',
        reading_text_bengali: 'Bengali reading 1',
        reading_text_hindi: 'Hindi reading 1',
        reading_text_english: 'English reading 1',
        confidence_score: '0.85'
      })
      .execute();

    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second palm reading
    await db.insert(palmReadingsTable)
      .values({
        user_id: userId,
        image_url: 'https://example.com/palm2.jpg',
        reading_text_bengali: 'Bengali reading 2',
        reading_text_hindi: 'Hindi reading 2',
        reading_text_english: 'English reading 2',
        confidence_score: '0.92'
      })
      .execute();

    const input: GetUserReadingsInput = {
      user_id: userId,
      language: 'english'
    };

    const result = await getUserPalmReadings(input);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].image_url).toEqual('https://example.com/palm2.jpg');
    expect(result[0].reading_text_english).toEqual('English reading 2');
    expect(result[0].confidence_score).toEqual(0.92);
    expect(typeof result[0].confidence_score).toBe('number');
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify ordering (newest first)
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should return empty array for user with no palm readings', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        preferred_language: 'english'
      })
      .returning()
      .execute();

    const input: GetUserReadingsInput = {
      user_id: user[0].id
    };

    const result = await getUserPalmReadings(input);

    expect(result).toHaveLength(0);
  });

  it('should only return readings for specified user', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          name: 'User 1',
          preferred_language: 'english'
        },
        {
          email: 'user2@example.com',
          name: 'User 2',
          preferred_language: 'hindi'
        }
      ])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;

    // Create palm readings for both users
    await db.insert(palmReadingsTable)
      .values([
        {
          user_id: user1Id,
          image_url: 'https://example.com/user1-palm.jpg',
          reading_text_bengali: 'User 1 Bengali reading',
          reading_text_hindi: 'User 1 Hindi reading',
          reading_text_english: 'User 1 English reading',
          confidence_score: '0.88'
        },
        {
          user_id: user2Id,
          image_url: 'https://example.com/user2-palm.jpg',
          reading_text_bengali: 'User 2 Bengali reading',
          reading_text_hindi: 'User 2 Hindi reading',
          reading_text_english: 'User 2 English reading',
          confidence_score: '0.75'
        }
      ])
      .execute();

    const input: GetUserReadingsInput = {
      user_id: user1Id,
      language: 'bengali'
    };

    const result = await getUserPalmReadings(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1Id);
    expect(result[0].reading_text_english).toEqual('User 1 English reading');
  });

  it('should handle numeric conversion correctly', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        preferred_language: 'english'
      })
      .returning()
      .execute();

    // Create palm reading with specific confidence score
    await db.insert(palmReadingsTable)
      .values({
        user_id: user[0].id,
        image_url: 'https://example.com/palm.jpg',
        reading_text_bengali: 'Bengali reading',
        reading_text_hindi: 'Hindi reading',
        reading_text_english: 'English reading',
        confidence_score: '0.75'
      })
      .execute();

    const input: GetUserReadingsInput = {
      user_id: user[0].id
    };

    const result = await getUserPalmReadings(input);

    expect(result).toHaveLength(1);
    expect(typeof result[0].confidence_score).toBe('number');
    expect(result[0].confidence_score).toEqual(0.75);
  });
});
