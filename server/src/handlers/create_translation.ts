
import { db } from '../db';
import { translationsTable } from '../db/schema';
import { type CreateTranslationInput, type Translation } from '../schema';
import { eq } from 'drizzle-orm';

export const createTranslation = async (input: CreateTranslationInput): Promise<Translation> => {
  try {
    // Check if translation key already exists
    const existingTranslation = await db.select()
      .from(translationsTable)
      .where(eq(translationsTable.key, input.key))
      .execute();

    if (existingTranslation.length > 0) {
      // Update existing translation
      const result = await db.update(translationsTable)
        .set({
          text_bengali: input.text_bengali,
          text_hindi: input.text_hindi,
          text_english: input.text_english,
          updated_at: new Date()
        })
        .where(eq(translationsTable.key, input.key))
        .returning()
        .execute();

      return result[0];
    } else {
      // Create new translation
      const result = await db.insert(translationsTable)
        .values({
          key: input.key,
          text_bengali: input.text_bengali,
          text_hindi: input.text_hindi,
          text_english: input.text_english
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('Translation creation/update failed:', error);
    throw error;
  }
};
