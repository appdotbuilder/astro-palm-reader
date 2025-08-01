
import { db } from '../db';
import { translationsTable } from '../db/schema';
import { type GetTranslationsInput } from '../schema';
import { inArray } from 'drizzle-orm';

export const getTranslations = async (input: GetTranslationsInput): Promise<Record<string, string>> => {
  try {
    // Execute query with or without key filter
    const results = input.keys && input.keys.length > 0
      ? await db.select()
          .from(translationsTable)
          .where(inArray(translationsTable.key, input.keys))
          .execute()
      : await db.select()
          .from(translationsTable)
          .execute();

    // Build key-value mapping based on requested language
    const translations: Record<string, string> = {};
    
    results.forEach(translation => {
      let text: string;
      switch (input.language) {
        case 'bengali':
          text = translation.text_bengali;
          break;
        case 'hindi':
          text = translation.text_hindi;
          break;
        case 'english':
        default:
          text = translation.text_english;
          break;
      }
      translations[translation.key] = text;
    });

    return translations;
  } catch (error) {
    console.error('Get translations failed:', error);
    throw error;
  }
};
