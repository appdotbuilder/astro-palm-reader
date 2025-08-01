
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, astrologyReadingsTable } from '../db/schema';
import { type GetUserReadingsInput, type CreateUserInput, type CreateAstrologyReadingInput } from '../schema';
import { getUserAstrologyReadings } from '../handlers/get_user_astrology_readings';

// Test user data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  preferred_language: 'english'
};

// Test astrology reading data
const testAstrologyReading: CreateAstrologyReadingInput = {
  user_id: 1, // Will be updated after user creation
  birth_date: new Date('1990-01-15'),
  birth_time: '14:30:00',
  birth_place: 'Mumbai, India',
  birth_latitude: 19.0760,
  birth_longitude: 72.8777,
  reading_text_bengali: 'আপনার জ্যোতিষ পড়া বাংলায়',
  reading_text_hindi: 'आपकी ज्योतिष पठन हिंदी में',
  reading_text_english: 'Your astrology reading in English',
  zodiac_sign: 'Capricorn',
  moon_sign: 'Leo',
  rising_sign: 'Virgo'
};

describe('getUserAstrologyReadings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return astrology readings for a user', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test astrology reading
    await db.insert(astrologyReadingsTable)
      .values({
        ...testAstrologyReading,
        user_id: userId,
        birth_latitude: testAstrologyReading.birth_latitude.toString(),
        birth_longitude: testAstrologyReading.birth_longitude.toString()
      })
      .execute();

    const input: GetUserReadingsInput = {
      user_id: userId
    };

    const result = await getUserAstrologyReadings(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].birth_place).toEqual('Mumbai, India');
    expect(result[0].birth_latitude).toEqual(19.0760);
    expect(result[0].birth_longitude).toEqual(72.8777);
    expect(typeof result[0].birth_latitude).toBe('number');
    expect(typeof result[0].birth_longitude).toBe('number');
    expect(result[0].zodiac_sign).toEqual('Capricorn');
    expect(result[0].moon_sign).toEqual('Leo');
    expect(result[0].rising_sign).toEqual('Virgo');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return readings ordered by creation date (newest first)', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create multiple astrology readings with different dates
    const olderReading = {
      ...testAstrologyReading,
      user_id: userId,
      birth_place: 'Delhi, India',
      birth_latitude: testAstrologyReading.birth_latitude.toString(),
      birth_longitude: testAstrologyReading.birth_longitude.toString()
    };

    const newerReading = {
      ...testAstrologyReading,
      user_id: userId,
      birth_place: 'Kolkata, India',
      birth_latitude: testAstrologyReading.birth_latitude.toString(),
      birth_longitude: testAstrologyReading.birth_longitude.toString()
    };

    // Insert older reading first
    await db.insert(astrologyReadingsTable)
      .values(olderReading)
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert newer reading
    await db.insert(astrologyReadingsTable)
      .values(newerReading)
      .execute();

    const input: GetUserReadingsInput = {
      user_id: userId
    };

    const result = await getUserAstrologyReadings(input);

    expect(result).toHaveLength(2);
    // Verify newest first ordering
    expect(result[0].birth_place).toEqual('Kolkata, India');
    expect(result[1].birth_place).toEqual('Delhi, India');
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should return empty array for user with no readings', async () => {
    // Create test user without any readings
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const input: GetUserReadingsInput = {
      user_id: userId
    };

    const result = await getUserAstrologyReadings(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return only readings for the specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        ...testUser,
        email: 'user2@example.com',
        name: 'User Two'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create readings for both users
    await db.insert(astrologyReadingsTable)
      .values({
        ...testAstrologyReading,
        user_id: user1Id,
        birth_place: 'User 1 Reading',
        birth_latitude: testAstrologyReading.birth_latitude.toString(),
        birth_longitude: testAstrologyReading.birth_longitude.toString()
      })
      .execute();

    await db.insert(astrologyReadingsTable)
      .values({
        ...testAstrologyReading,
        user_id: user2Id,
        birth_place: 'User 2 Reading',
        birth_latitude: testAstrologyReading.birth_latitude.toString(),
        birth_longitude: testAstrologyReading.birth_longitude.toString()
      })
      .execute();

    const input: GetUserReadingsInput = {
      user_id: user1Id
    };

    const result = await getUserAstrologyReadings(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1Id);
    expect(result[0].birth_place).toEqual('User 1 Reading');
  });
});
