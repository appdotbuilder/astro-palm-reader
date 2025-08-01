
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Language enum
export const languageEnum = pgEnum('language', ['bengali', 'hindi', 'english']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  preferred_language: languageEnum('preferred_language').notNull().default('english'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Palm readings table
export const palmReadingsTable = pgTable('palm_readings', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  image_url: text('image_url').notNull(),
  reading_text_bengali: text('reading_text_bengali').notNull(),
  reading_text_hindi: text('reading_text_hindi').notNull(),
  reading_text_english: text('reading_text_english').notNull(),
  confidence_score: numeric('confidence_score', { precision: 3, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Astrology readings table
export const astrologyReadingsTable = pgTable('astrology_readings', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  birth_date: timestamp('birth_date').notNull(),
  birth_time: text('birth_time').notNull(),
  birth_place: text('birth_place').notNull(),
  birth_latitude: numeric('birth_latitude', { precision: 10, scale: 7 }).notNull(),
  birth_longitude: numeric('birth_longitude', { precision: 10, scale: 7 }).notNull(),
  reading_text_bengali: text('reading_text_bengali').notNull(),
  reading_text_hindi: text('reading_text_hindi').notNull(),
  reading_text_english: text('reading_text_english').notNull(),
  zodiac_sign: text('zodiac_sign').notNull(),
  moon_sign: text('moon_sign').notNull(),
  rising_sign: text('rising_sign').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Translations table for UI elements
export const translationsTable = pgTable('translations', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  text_bengali: text('text_bengali').notNull(),
  text_hindi: text('text_hindi').notNull(),
  text_english: text('text_english').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  palmReadings: many(palmReadingsTable),
  astrologyReadings: many(astrologyReadingsTable),
}));

export const palmReadingsRelations = relations(palmReadingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [palmReadingsTable.user_id],
    references: [usersTable.id],
  }),
}));

export const astrologyReadingsRelations = relations(astrologyReadingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [astrologyReadingsTable.user_id],
    references: [usersTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  palmReadings: palmReadingsTable,
  astrologyReadings: astrologyReadingsTable,
  translations: translationsTable,
};

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type PalmReading = typeof palmReadingsTable.$inferSelect;
export type NewPalmReading = typeof palmReadingsTable.$inferInsert;
export type AstrologyReading = typeof astrologyReadingsTable.$inferSelect;
export type NewAstrologyReading = typeof astrologyReadingsTable.$inferInsert;
export type Translation = typeof translationsTable.$inferSelect;
export type NewTranslation = typeof translationsTable.$inferInsert;
