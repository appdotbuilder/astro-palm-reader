
import { db } from '../db';
import { astrologyReadingsTable } from '../db/schema';
import { type GetReadingByIdInput, type AstrologyReading } from '../schema';
import { eq } from 'drizzle-orm';

export const getAstrologyReadingById = async (input: GetReadingByIdInput): Promise<AstrologyReading | null> => {
  try {
    const results = await db.select()
      .from(astrologyReadingsTable)
      .where(eq(astrologyReadingsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const reading = results[0];
    
    // Convert numeric fields back to numbers
    return {
      ...reading,
      birth_latitude: parseFloat(reading.birth_latitude),
      birth_longitude: parseFloat(reading.birth_longitude)
    };
  } catch (error) {
    console.error('Get astrology reading by ID failed:', error);
    throw error;
  }
};
