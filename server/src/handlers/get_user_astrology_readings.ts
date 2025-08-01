
import { db } from '../db';
import { astrologyReadingsTable } from '../db/schema';
import { type GetUserReadingsInput, type AstrologyReading } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserAstrologyReadings = async (input: GetUserReadingsInput): Promise<AstrologyReading[]> => {
  try {
    // Query astrology readings for the user, ordered by creation date (newest first)
    const results = await db.select()
      .from(astrologyReadingsTable)
      .where(eq(astrologyReadingsTable.user_id, input.user_id))
      .orderBy(desc(astrologyReadingsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(reading => ({
      ...reading,
      birth_latitude: parseFloat(reading.birth_latitude),
      birth_longitude: parseFloat(reading.birth_longitude)
    }));
  } catch (error) {
    console.error('Failed to get user astrology readings:', error);
    throw error;
  }
};
