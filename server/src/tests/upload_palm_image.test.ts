
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
    
    // Verify detailed analysis content in Bengali
    expect(result.reading_text_bengali).toContain('হস্তরেখা বিশ্লেষণ');
    expect(result.reading_text_bengali).toContain('হৃদয়রেখা');
    expect(result.reading_text_bengali).toContain('মস্তিষ্করেখা');
    expect(result.reading_text_bengali).toContain('জীবনরেখা');
    expect(result.reading_text_bengali).toContain('ভাগ্যরেখা');
    
    // Verify detailed analysis content in Hindi
    expect(result.reading_text_hindi).toContain('हस्तरेखा का विश्लेषण');
    expect(result.reading_text_hindi).toContain('हृदय रेखा');
    expect(result.reading_text_hindi).toContain('मस्तिष्क रेखा');
    expect(result.reading_text_hindi).toContain('जीवन रेखा');
    expect(result.reading_text_hindi).toContain('भाग्य रेखा');
    
    // Verify detailed analysis content in English
    expect(result.reading_text_english).toContain('palm reading reveals');
    expect(result.reading_text_english).toContain('Heart Line:');
    expect(result.reading_text_english).toContain('Head Line:');
    expect(result.reading_text_english).toContain('Life Line:');
    expect(result.reading_text_english).toContain('Fate Line:');
    
    expect(typeof result.confidence_score).toBe('number');
    expect(result.confidence_score).toBeGreaterThanOrEqual(0.6);
    expect(result.confidence_score).toBeLessThanOrEqual(0.95);
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
    
    // Verify detailed readings are saved correctly
    expect(palmReadings[0].reading_text_bengali).toContain('হস্তরেখা বিশ্লেষণ');
    expect(palmReadings[0].reading_text_bengali).toContain('হৃদয়রেখা');
    expect(palmReadings[0].reading_text_hindi).toContain('हस्तरेखा का विश्लेषण');
    expect(palmReadings[0].reading_text_hindi).toContain('हृदय रेखा');
    expect(palmReadings[0].reading_text_english).toContain('palm reading reveals');
    expect(palmReadings[0].reading_text_english).toContain('Heart Line:');
    
    const confidenceScore = parseFloat(palmReadings[0].confidence_score);
    expect(confidenceScore).toBeGreaterThanOrEqual(0.6);
    expect(confidenceScore).toBeLessThanOrEqual(0.95);
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

  it('should generate varied confidence scores', async () => {
    const input = { ...testInput, user_id: testUserId };
    const results = [];
    
    // Generate multiple readings to test confidence score variation
    for (let i = 0; i < 5; i++) {
      const result = await uploadPalmImage(input);
      results.push(result.confidence_score);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    
    // All confidence scores should be within valid range
    results.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0.6);
      expect(score).toBeLessThanOrEqual(0.95);
      expect(typeof score).toBe('number');
    });
    
    // Check that we get some variation (not all exactly the same)
    const uniqueScores = new Set(results);
    expect(uniqueScores.size).toBeGreaterThan(1); // Should have some variation
  });

  it('should provide comprehensive palm line analysis', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await uploadPalmImage(input);

    // Verify that all major palm lines are analyzed in Bengali
    expect(result.reading_text_bengali).toContain('হৃদয়রেখা:');
    expect(result.reading_text_bengali).toContain('মস্তিষ্করেখা:');
    expect(result.reading_text_bengali).toContain('জীবনরেখা:');
    expect(result.reading_text_bengali).toContain('ভাগ্যরেখা:');
    
    // Verify that all major palm lines are analyzed in Hindi
    expect(result.reading_text_hindi).toContain('हृदय रेखा:');
    expect(result.reading_text_hindi).toContain('मस्तिष्क रेखा:');
    expect(result.reading_text_hindi).toContain('जीवन रेखा:');
    expect(result.reading_text_hindi).toContain('भाग्य रेखा:');
    
    // Verify that all major palm lines are analyzed in English
    expect(result.reading_text_english).toContain('Heart Line:');
    expect(result.reading_text_english).toContain('Head Line:');
    expect(result.reading_text_english).toContain('Life Line:');
    expect(result.reading_text_english).toContain('Fate Line:');
    
    // Verify comprehensive analysis - each reading should be substantial
    expect(result.reading_text_bengali.length).toBeGreaterThan(1000);
    expect(result.reading_text_hindi.length).toBeGreaterThan(1000);
    expect(result.reading_text_english.length).toBeGreaterThan(1000);
    
    // Verify overall reading conclusion is present
    expect(result.reading_text_bengali).toContain('সামগ্রিকভাবে');
    expect(result.reading_text_hindi).toContain('कुल मिलाकर');
    expect(result.reading_text_english).toContain('Overall');
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
      
      // All readings should contain detailed text in all three languages regardless of input language
      expect(result.reading_text_bengali).toContain('হস্তরেখা বিশ্লেষণ');
      expect(result.reading_text_bengali.length).toBeGreaterThan(500); // Ensure substantial content
      
      expect(result.reading_text_hindi).toContain('हस्तरेखा का विश्लेषण');
      expect(result.reading_text_hindi.length).toBeGreaterThan(500);
      
      expect(result.reading_text_english).toContain('palm reading reveals');
      expect(result.reading_text_english.length).toBeGreaterThan(500);
      
      expect(result.user_id).toEqual(testUserId);
      expect(result.confidence_score).toBeGreaterThanOrEqual(0.6);
      expect(result.confidence_score).toBeLessThanOrEqual(0.95);
    }
  });
});
