
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, astrologyReadingsTable } from '../db/schema';
import { type GetReadingByIdInput } from '../schema';
import { getAstrologyReadingById } from '../handlers/get_astrology_reading_by_id';

describe('getAstrologyReadingById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return astrology reading by id', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        preferred_language: 'english'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test astrology reading
    const readingResult = await db.insert(astrologyReadingsTable)
      .values({
        user_id: userId,
        birth_date: new Date('1990-01-01'),
        birth_time: '10:30 AM',
        birth_place: 'Mumbai, India',
        birth_latitude: '19.0760',
        birth_longitude: '72.8777',
        reading_text_bengali: 'Test Bengali reading',
        reading_text_hindi: 'Test Hindi reading',
        reading_text_english: 'Test English reading',
        zodiac_sign: 'Capricorn',
        moon_sign: 'Leo',
        rising_sign: 'Virgo'
      })
      .returning()
      .execute();

    const readingId = readingResult[0].id;

    const input: GetReadingByIdInput = {
      id: readingId,
      language: 'english'
    };

    const result = await getAstrologyReadingById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(readingId);
    expect(result!.user_id).toEqual(userId);
    expect(result!.birth_place).toEqual('Mumbai, India');
    expect(result!.birth_time).toEqual('10:30 AM');
    expect(result!.reading_text_english).toEqual('Test English reading');
    expect(result!.reading_text_hindi).toEqual('Test Hindi reading');
    expect(result!.reading_text_bengali).toEqual('Test Bengali reading');
    expect(result!.zodiac_sign).toEqual('Capricorn');
    expect(result!.moon_sign).toEqual('Leo');
    expect(result!.rising_sign).toEqual('Virgo');
    expect(typeof result!.birth_latitude).toBe('number');
    expect(typeof result!.birth_longitude).toBe('number');
    expect(result!.birth_latitude).toEqual(19.0760);
    expect(result!.birth_longitude).toEqual(72.8777);
    expect(result!.birth_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent reading', async () => {
    const input: GetReadingByIdInput = {
      id: 999,
      language: 'english'
    };

    const result = await getAstrologyReadingById(input);

    expect(result).toBeNull();
  });

  it('should handle reading without language parameter', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        name: 'Test User 2',
        preferred_language: 'hindi'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test astrology reading
    const readingResult = await db.insert(astrologyReadingsTable)
      .values({
        user_id: userId,
        birth_date: new Date('1985-06-15'),
        birth_time: '2:15 PM',
        birth_place: 'Delhi, India',
        birth_latitude: '28.7041',
        birth_longitude: '77.1025',
        reading_text_bengali: 'Delhi Bengali reading',
        reading_text_hindi: 'Delhi Hindi reading',
        reading_text_english: 'Delhi English reading',
        zodiac_sign: 'Gemini',
        moon_sign: 'Aries',
        rising_sign: 'Scorpio'
      })
      .returning()
      .execute();

    const readingId = readingResult[0].id;

    const input: GetReadingByIdInput = {
      id: readingId
    };

    const result = await getAstrologyReadingById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(readingId);
    expect(result!.birth_place).toEqual('Delhi, India');
    expect(result!.zodiac_sign).toEqual('Gemini');
    expect(result!.moon_sign).toEqual('Aries');
    expect(result!.rising_sign).toEqual('Scorpio');
  });
});
