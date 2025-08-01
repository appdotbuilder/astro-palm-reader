
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { translationsTable } from '../db/schema';
import { type GetTranslationsInput, type CreateTranslationInput } from '../schema';
import { getTranslations } from '../handlers/get_translations';

// Test translation data
const testTranslations: CreateTranslationInput[] = [
  {
    key: 'welcome_message',
    text_bengali: 'জ্যোতিষ অ্যাপে স্বাগতম',
    text_hindi: 'ज्योतिष ऐप में आपका स्वागत है',
    text_english: 'Welcome to the Astrology App'
  },
  {
    key: 'upload_palm',
    text_bengali: 'হাতের ছবি আপলোড করুন',
    text_hindi: 'हाथ की फोटो अपलोड करें',
    text_english: 'Upload Palm Photo'
  },
  {
    key: 'birth_details',
    text_bengali: 'জন্মের বিবরণ লিখুন',
    text_hindi: 'जन्म विवरण दर्ज करें',
    text_english: 'Enter Birth Details'
  }
];

describe('getTranslations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create test translations
  const createTestTranslations = async () => {
    await db.insert(translationsTable)
      .values(testTranslations)
      .execute();
  };

  it('should return all translations for english', async () => {
    await createTestTranslations();

    const input: GetTranslationsInput = {
      language: 'english'
    };

    const result = await getTranslations(input);

    expect(Object.keys(result)).toHaveLength(3);
    expect(result['welcome_message']).toEqual('Welcome to the Astrology App');
    expect(result['upload_palm']).toEqual('Upload Palm Photo');
    expect(result['birth_details']).toEqual('Enter Birth Details');
  });

  it('should return all translations for bengali', async () => {
    await createTestTranslations();

    const input: GetTranslationsInput = {
      language: 'bengali'
    };

    const result = await getTranslations(input);

    expect(Object.keys(result)).toHaveLength(3);
    expect(result['welcome_message']).toEqual('জ্যোতিষ অ্যাপে স্বাগতম');
    expect(result['upload_palm']).toEqual('হাতের ছবি আপলোড করুন');
    expect(result['birth_details']).toEqual('জন্মের বিবরণ লিখুন');
  });

  it('should return all translations for hindi', async () => {
    await createTestTranslations();

    const input: GetTranslationsInput = {
      language: 'hindi'
    };

    const result = await getTranslations(input);

    expect(Object.keys(result)).toHaveLength(3);
    expect(result['welcome_message']).toEqual('ज्योतिष ऐप में आपका स्वागत है');
    expect(result['upload_palm']).toEqual('हाथ की फोटो अपलोड करें');
    expect(result['birth_details']).toEqual('जन्म विवरण दर्ज करें');
  });

  it('should return only specific translations when keys are provided', async () => {
    await createTestTranslations();

    const input: GetTranslationsInput = {
      language: 'english',
      keys: ['welcome_message', 'upload_palm']
    };

    const result = await getTranslations(input);

    expect(Object.keys(result)).toHaveLength(2);
    expect(result['welcome_message']).toEqual('Welcome to the Astrology App');
    expect(result['upload_palm']).toEqual('Upload Palm Photo');
    expect(result['birth_details']).toBeUndefined();
  });

  it('should return empty object when no translations exist', async () => {
    const input: GetTranslationsInput = {
      language: 'english'
    };

    const result = await getTranslations(input);

    expect(Object.keys(result)).toHaveLength(0);
    expect(result).toEqual({});
  });

  it('should return empty object when requesting non-existent keys', async () => {
    await createTestTranslations();

    const input: GetTranslationsInput = {
      language: 'english',
      keys: ['non_existent_key', 'another_missing_key']
    };

    const result = await getTranslations(input);

    expect(Object.keys(result)).toHaveLength(0);
    expect(result).toEqual({});
  });

  it('should return partial results when some keys exist', async () => {
    await createTestTranslations();

    const input: GetTranslationsInput = {
      language: 'english',
      keys: ['welcome_message', 'non_existent_key', 'upload_palm']
    };

    const result = await getTranslations(input);

    expect(Object.keys(result)).toHaveLength(2);
    expect(result['welcome_message']).toEqual('Welcome to the Astrology App');
    expect(result['upload_palm']).toEqual('Upload Palm Photo');
    expect(result['non_existent_key']).toBeUndefined();
  });
});
