
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { translationsTable } from '../db/schema';
import { type CreateTranslationInput } from '../schema';
import { createTranslation } from '../handlers/create_translation';
import { eq } from 'drizzle-orm';

const testInput: CreateTranslationInput = {
  key: 'welcome_message',
  text_bengali: 'স্বাগতম',
  text_hindi: 'स्वागत है',
  text_english: 'Welcome'
};

describe('createTranslation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new translation', async () => {
    const result = await createTranslation(testInput);

    expect(result.key).toEqual('welcome_message');
    expect(result.text_bengali).toEqual('স্বাগতম');
    expect(result.text_hindi).toEqual('स्वागत है');
    expect(result.text_english).toEqual('Welcome');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save translation to database', async () => {
    const result = await createTranslation(testInput);

    const translations = await db.select()
      .from(translationsTable)
      .where(eq(translationsTable.id, result.id))
      .execute();

    expect(translations).toHaveLength(1);
    expect(translations[0].key).toEqual('welcome_message');
    expect(translations[0].text_bengali).toEqual('স্বাগতম');
    expect(translations[0].text_hindi).toEqual('स्वागत है');
    expect(translations[0].text_english).toEqual('Welcome');
  });

  it('should update existing translation when key already exists', async () => {
    // Create initial translation
    await createTranslation(testInput);

    // Update with new text
    const updateInput: CreateTranslationInput = {
      key: 'welcome_message',
      text_bengali: 'নমস্কার',
      text_hindi: 'नमस्ते',
      text_english: 'Hello'
    };

    const result = await createTranslation(updateInput);

    expect(result.key).toEqual('welcome_message');
    expect(result.text_bengali).toEqual('নমস্কার');
    expect(result.text_hindi).toEqual('नमस्ते');
    expect(result.text_english).toEqual('Hello');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should maintain only one record when updating existing key', async () => {
    // Create initial translation
    await createTranslation(testInput);

    // Update existing translation
    const updateInput: CreateTranslationInput = {
      key: 'welcome_message',
      text_bengali: 'নমস্কার',
      text_hindi: 'नमस्ते',
      text_english: 'Hello'
    };

    await createTranslation(updateInput);

    // Verify only one record exists for this key
    const translations = await db.select()
      .from(translationsTable)
      .where(eq(translationsTable.key, 'welcome_message'))
      .execute();

    expect(translations).toHaveLength(1);
    expect(translations[0].text_bengali).toEqual('নমস্কার');
    expect(translations[0].text_hindi).toEqual('नमस्ते');
    expect(translations[0].text_english).toEqual('Hello');
  });

  it('should handle different translation keys independently', async () => {
    // Create first translation
    await createTranslation(testInput);

    // Create second translation with different key
    const secondInput: CreateTranslationInput = {
      key: 'goodbye_message',
      text_bengali: 'বিদায়',
      text_hindi: 'विदा',
      text_english: 'Goodbye'
    };

    const result = await createTranslation(secondInput);

    expect(result.key).toEqual('goodbye_message');
    expect(result.text_bengali).toEqual('বিদায়');

    // Verify both translations exist
    const allTranslations = await db.select()
      .from(translationsTable)
      .execute();

    expect(allTranslations).toHaveLength(2);
  });
});
