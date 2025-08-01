
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, palmReadingsTable } from '../db/schema';
import { type UploadImageInput } from '../schema';
import { uploadPalmImage } from '../handlers/upload_palm_image';
import { eq } from 'drizzle-orm';

describe('uploadPalmImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        preferred_language: 'english'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  const testInput: UploadImageInput = {
    user_id: 0, // Will be set in beforeEach
    image_data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/...',
    language: 'english'
  };

  it('should create a palm reading', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await uploadPalmImage(input);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.image_url).toContain('palm-images.example.com');
    expect(result.reading_text_bengali).toContain('আপনার হাতের রেখা');
    expect(result.reading_text_hindi).toContain('आपकी हथेली');
    expect(result.reading_text_english).toContain('According to your palm');
    expect(typeof result.confidence_score).toBe('number');
    expect(result.confidence_score).toEqual(0.85);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save palm reading to database', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await uploadPalmImage(input);

    // Query using proper drizzle syntax
    const palmReadings = await db.select()
      .from(palmReadingsTable)
      .where(eq(palmReadingsTable.id, result.id))
      .execute();

    expect(palmReadings).toHaveLength(1);
    expect(palmReadings[0].user_id).toEqual(testUserId);
    expect(palmReadings[0].image_url).toContain('palm-images.example.com');
    expect(palmReadings[0].reading_text_bengali).toContain('আপনার হাতের রেখা');
    expect(palmReadings[0].reading_text_hindi).toContain('आपकी हथेली');
    expect(palmReadings[0].reading_text_english).toContain('According to your palm');
    expect(parseFloat(palmReadings[0].confidence_score)).toEqual(0.85);
    expect(palmReadings[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique image URLs', async () => {
    const input = { ...testInput, user_id: testUserId };
    
    const result1 = await uploadPalmImage(input);
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    const result2 = await uploadPalmImage(input);

    expect(result1.image_url).not.toEqual(result2.image_url);
    expect(result1.image_url).toContain(`user-${testUserId}`);
    expect(result2.image_url).toContain(`user-${testUserId}`);
  });

  it('should reject invalid user_id', async () => {
    const input = { ...testInput, user_id: 99999 };
    
    await expect(uploadPalmImage(input)).rejects.toThrow(/user not found/i);
  });

  it('should handle different languages', async () => {
    const inputs = [
      { ...testInput, user_id: testUserId, language: 'bengali' as const },
      { ...testInput, user_id: testUserId, language: 'hindi' as const },
      { ...testInput, user_id: testUserId, language: 'english' as const }
    ];

    for (const input of inputs) {
      const result = await uploadPalmImage(input);
      
      // All readings should contain text in all three languages regardless of input language
      expect(result.reading_text_bengali).toBeTruthy();
      expect(result.reading_text_hindi).toBeTruthy();
      expect(result.reading_text_english).toBeTruthy();
      expect(result.user_id).toEqual(testUserId);
    }
  });
});
