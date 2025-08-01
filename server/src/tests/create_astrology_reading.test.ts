
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { astrologyReadingsTable, usersTable } from '../db/schema';
import { type CreateAstrologyReadingInput } from '../schema';
import { createAstrologyReading } from '../handlers/create_astrology_reading';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  preferred_language: 'english' as const
};

// Test astrology reading input
const testInput: CreateAstrologyReadingInput = {
  user_id: 1, // Will be updated after user creation
  birth_date: new Date('1990-05-15'),
  birth_time: '14:30',
  birth_place: 'New York, NY',
  birth_latitude: 40.7128,
  birth_longitude: -74.0060,
  reading_text_bengali: 'আপনার জন্মের সময় অনুযায়ী জ্যোতিষ বিশ্লেষণ',
  reading_text_hindi: 'आपके जन्म के समय के अनुसार ज्योतिष विश्लेषण',
  reading_text_english: 'Astrological analysis based on your birth time',
  zodiac_sign: 'Taurus',
  moon_sign: 'Cancer',
  rising_sign: 'Virgo'
};

describe('createAstrologyReading', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an astrology reading', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const inputWithUserId = { ...testInput, user_id: userId };

    const result = await createAstrologyReading(inputWithUserId);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.birth_date).toEqual(testInput.birth_date);
    expect(result.birth_time).toEqual('14:30');
    expect(result.birth_place).toEqual('New York, NY');
    expect(result.birth_latitude).toEqual(40.7128);
    expect(result.birth_longitude).toEqual(-74.0060);
    expect(result.reading_text_bengali).toEqual(testInput.reading_text_bengali);
    expect(result.reading_text_hindi).toEqual(testInput.reading_text_hindi);
    expect(result.reading_text_english).toEqual(testInput.reading_text_english);
    expect(result.zodiac_sign).toEqual('Taurus');
    expect(result.moon_sign).toEqual('Cancer');
    expect(result.rising_sign).toEqual('Virgo');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save astrology reading to database', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const inputWithUserId = { ...testInput, user_id: userId };

    const result = await createAstrologyReading(inputWithUserId);

    // Query database to verify data was saved
    const readings = await db.select()
      .from(astrologyReadingsTable)
      .where(eq(astrologyReadingsTable.id, result.id))
      .execute();

    expect(readings).toHaveLength(1);
    expect(readings[0].user_id).toEqual(userId);
    expect(readings[0].birth_date).toEqual(testInput.birth_date);
    expect(readings[0].birth_time).toEqual('14:30');
    expect(readings[0].birth_place).toEqual('New York, NY');
    expect(parseFloat(readings[0].birth_latitude)).toEqual(40.7128);
    expect(parseFloat(readings[0].birth_longitude)).toEqual(-74.0060);
    expect(readings[0].reading_text_bengali).toEqual(testInput.reading_text_bengali);
    expect(readings[0].reading_text_hindi).toEqual(testInput.reading_text_hindi);
    expect(readings[0].reading_text_english).toEqual(testInput.reading_text_english);
    expect(readings[0].zodiac_sign).toEqual('Taurus');
    expect(readings[0].moon_sign).toEqual('Cancer');
    expect(readings[0].rising_sign).toEqual('Virgo');
    expect(readings[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle numeric coordinate conversion correctly', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Test with extreme coordinate values
    const extremeInput = {
      ...testInput,
      user_id: userId,
      birth_latitude: -89.9999,
      birth_longitude: 179.9999
    };

    const result = await createAstrologyReading(extremeInput);

    // Verify numeric types are preserved
    expect(typeof result.birth_latitude).toBe('number');
    expect(typeof result.birth_longitude).toBe('number');
    expect(result.birth_latitude).toEqual(-89.9999);
    expect(result.birth_longitude).toEqual(179.9999);
  });

  it('should throw error for non-existent user', async () => {
    const invalidInput = { ...testInput, user_id: 999 };

    await expect(createAstrologyReading(invalidInput))
      .rejects.toThrow(/User with id 999 does not exist/i);
  });

  it('should handle multilingual text correctly', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Test with complex multilingual content
    const multilingualInput = {
      ...testInput,
      user_id: userId,
      reading_text_bengali: 'বৃষ রাশিতে জন্মগ্রহণকারী ব্যক্তিদের স্থিতিশীল প্রকৃতি রয়েছে',
      reading_text_hindi: 'वृषभ राशि में जन्म लेने वाले व्यक्तियों का स्वभाव स्थिर होता है',
      reading_text_english: 'Individuals born under Taurus sign have a stable nature'
    };

    const result = await createAstrologyReading(multilingualInput);

    expect(result.reading_text_bengali).toEqual(multilingualInput.reading_text_bengali);
    expect(result.reading_text_hindi).toEqual(multilingualInput.reading_text_hindi);
    expect(result.reading_text_english).toEqual(multilingualInput.reading_text_english);
  });
});
