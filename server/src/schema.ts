
import { z } from 'zod';

// Supported languages enum
export const languageSchema = z.enum(['bengali', 'hindi', 'english']);
export type Language = z.infer<typeof languageSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  preferred_language: languageSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Create user input schema
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  preferred_language: languageSchema
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Update user input schema
export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  preferred_language: languageSchema.optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Palm reading schema
export const palmReadingSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  image_url: z.string(),
  reading_text_bengali: z.string(),
  reading_text_hindi: z.string(),
  reading_text_english: z.string(),
  confidence_score: z.number().min(0).max(1),
  created_at: z.coerce.date()
});

export type PalmReading = z.infer<typeof palmReadingSchema>;

// Create palm reading input schema
export const createPalmReadingInputSchema = z.object({
  user_id: z.number(),
  image_url: z.string().url(),
  reading_text_bengali: z.string(),
  reading_text_hindi: z.string(),
  reading_text_english: z.string(),
  confidence_score: z.number().min(0).max(1)
});

export type CreatePalmReadingInput = z.infer<typeof createPalmReadingInputSchema>;

// Astrology reading schema
export const astrologyReadingSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  birth_date: z.coerce.date(),
  birth_time: z.string(),
  birth_place: z.string(),
  birth_latitude: z.number(),
  birth_longitude: z.number(),
  reading_text_bengali: z.string(),
  reading_text_hindi: z.string(),
  reading_text_english: z.string(),
  zodiac_sign: z.string(),
  moon_sign: z.string(),
  rising_sign: z.string(),
  created_at: z.coerce.date()
});

export type AstrologyReading = z.infer<typeof astrologyReadingSchema>;

// Create astrology reading input schema
export const createAstrologyReadingInputSchema = z.object({
  user_id: z.number(),
  birth_date: z.coerce.date(),
  birth_time: z.string(),
  birth_place: z.string(),
  birth_latitude: z.number().min(-90).max(90),
  birth_longitude: z.number().min(-180).max(180),
  reading_text_bengali: z.string(),
  reading_text_hindi: z.string(),
  reading_text_english: z.string(),
  zodiac_sign: z.string(),
  moon_sign: z.string(),
  rising_sign: z.string()
});

export type CreateAstrologyReadingInput = z.infer<typeof createAstrologyReadingInputSchema>;

// Translation schema for UI elements
export const translationSchema = z.object({
  id: z.number(),
  key: z.string(),
  text_bengali: z.string(),
  text_hindi: z.string(),
  text_english: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Translation = z.infer<typeof translationSchema>;

// Create translation input schema
export const createTranslationInputSchema = z.object({
  key: z.string(),
  text_bengali: z.string(),
  text_hindi: z.string(),
  text_english: z.string()
});

export type CreateTranslationInput = z.infer<typeof createTranslationInputSchema>;

// Get readings input schema
export const getUserReadingsInputSchema = z.object({
  user_id: z.number(),
  language: languageSchema.optional()
});

export type GetUserReadingsInput = z.infer<typeof getUserReadingsInputSchema>;

// Get reading by ID input schema
export const getReadingByIdInputSchema = z.object({
  id: z.number(),
  language: languageSchema.optional()
});

export type GetReadingByIdInput = z.infer<typeof getReadingByIdInputSchema>;

// Upload image input schema
export const uploadImageInputSchema = z.object({
  user_id: z.number(),
  image_data: z.string(), // Base64 encoded image
  language: languageSchema
});

export type UploadImageInput = z.infer<typeof uploadImageInputSchema>;

// Get translations input schema
export const getTranslationsInputSchema = z.object({
  language: languageSchema,
  keys: z.array(z.string()).optional()
});

export type GetTranslationsInput = z.infer<typeof getTranslationsInputSchema>;
