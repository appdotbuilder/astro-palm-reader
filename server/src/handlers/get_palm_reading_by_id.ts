
import { db } from '../db';
import { palmReadingsTable } from '../db/schema';
import { type GetReadingByIdInput, type PalmReading } from '../schema';
import { eq } from 'drizzle-orm';

export const getPalmReadingById = async (input: GetReadingByIdInput): Promise<PalmReading | null> => {
  try {
    // Query palm reading by ID
    const results = await db.select()
      .from(palmReadingsTable)
      .where(eq(palmReadingsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers
    const reading = results[0];
    return {
      ...reading,
      confidence_score: parseFloat(reading.confidence_score)
    };
  } catch (error) {
    console.error('Failed to get palm reading by ID:', error);
    throw error;
  }
};
