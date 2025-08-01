
import { db } from '../db';
import { astrologyReadingsTable, usersTable } from '../db/schema';
import { type CreateAstrologyReadingInput, type AstrologyReading } from '../schema';
import { eq } from 'drizzle-orm';

export const createAstrologyReading = async (input: CreateAstrologyReadingInput): Promise<AstrologyReading> => {
  try {
    // Verify user exists
    const userExists = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Insert astrology reading record
    const result = await db.insert(astrologyReadingsTable)
      .values({
        user_id: input.user_id,
        birth_date: input.birth_date,
        birth_time: input.birth_time,
        birth_place: input.birth_place,
        birth_latitude: input.birth_latitude.toString(), // Convert number to string for numeric column
        birth_longitude: input.birth_longitude.toString(), // Convert number to string for numeric column
        reading_text_bengali: input.reading_text_bengali,
        reading_text_hindi: input.reading_text_hindi,
        reading_text_english: input.reading_text_english,
        zodiac_sign: input.zodiac_sign,
        moon_sign: input.moon_sign,
        rising_sign: input.rising_sign
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const reading = result[0];
    return {
      ...reading,
      birth_latitude: parseFloat(reading.birth_latitude), // Convert string back to number
      birth_longitude: parseFloat(reading.birth_longitude) // Convert string back to number
    };
  } catch (error) {
    console.error('Astrology reading creation failed:', error);
    throw error;
  }
};
