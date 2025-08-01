
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, palmReadingsTable } from '../db/schema';
import { type CreateUserInput, type CreatePalmReadingInput, type GetReadingByIdInput } from '../schema';
import { getPalmReadingById } from '../handlers/get_palm_reading_by_id';

// Test user data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  preferred_language: 'english'
};

// Test palm reading data
const testPalmReading: CreatePalmReadingInput = {
  user_id: 1, // Will be set after user creation
  image_url: 'https://example.com/palm.jpg',
  reading_text_bengali: 'তালু পড়ার বাংলা পাঠ',
  reading_text_hindi: 'हथेली पढ़ने का हिंदी पाठ',
  reading_text_english: 'English palm reading text',
  confidence_score: 0.85
};

describe('getPalmReadingById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return palm reading by ID', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        preferred_language: testUser.preferred_language
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create palm reading
    const palmReadingResult = await db.insert(palmReadingsTable)
      .values({
        ...testPalmReading,
        user_id: userId,
        confidence_score: testPalmReading.confidence_score.toString()
      })
      .returning()
      .execute();

    const readingId = palmReadingResult[0].id;

    // Test input
    const input: GetReadingByIdInput = {
      id: readingId,
      language: 'english'
    };

    const result = await getPalmReadingById(input);

    // Validate result
    expect(result).toBeDefined();
    expect(result!.id).toEqual(readingId);
    expect(result!.user_id).toEqual(userId);
    expect(result!.image_url).toEqual(testPalmReading.image_url);
    expect(result!.reading_text_bengali).toEqual(testPalmReading.reading_text_bengali);
    expect(result!.reading_text_hindi).toEqual(testPalmReading.reading_text_hindi);
    expect(result!.reading_text_english).toEqual(testPalmReading.reading_text_english);
    expect(result!.confidence_score).toEqual(0.85);
    expect(typeof result!.confidence_score).toBe('number');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent reading ID', async () => {
    const input: GetReadingByIdInput = {
      id: 999,
      language: 'english'
    };

    const result = await getPalmReadingById(input);

    expect(result).toBeNull();
  });

  it('should work with different language parameter', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        preferred_language: testUser.preferred_language
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create palm reading
    const palmReadingResult = await db.insert(palmReadingsTable)
      .values({
        ...testPalmReading,
        user_id: userId,
        confidence_score: testPalmReading.confidence_score.toString()
      })
      .returning()
      .execute();

    const readingId = palmReadingResult[0].id;

    // Test with different languages
    const inputBengali: GetReadingByIdInput = {
      id: readingId,
      language: 'bengali'
    };

    const resultBengali = await getPalmReadingById(inputBengali);

    expect(resultBengali).toBeDefined();
    expect(resultBengali!.id).toEqual(readingId);
    expect(resultBengali!.reading_text_bengali).toEqual(testPalmReading.reading_text_bengali);

    // Test without language parameter
    const inputNoLang: GetReadingByIdInput = {
      id: readingId
    };

    const resultNoLang = await getPalmReadingById(inputNoLang);

    expect(resultNoLang).toBeDefined();
    expect(resultNoLang!.id).toEqual(readingId);
  });

  it('should handle numeric precision correctly', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        preferred_language: testUser.preferred_language
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create palm reading with specific confidence score
    const specificConfidence = 0.92;
    const palmReadingResult = await db.insert(palmReadingsTable)
      .values({
        ...testPalmReading,
        user_id: userId,
        confidence_score: specificConfidence.toString()
      })
      .returning()
      .execute();

    const readingId = palmReadingResult[0].id;

    const input: GetReadingByIdInput = {
      id: readingId,
      language: 'english'
    };

    const result = await getPalmReadingById(input);

    expect(result).toBeDefined();
    expect(result!.confidence_score).toEqual(0.92);
    expect(typeof result!.confidence_score).toBe('number');
  });
});
