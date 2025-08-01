
import { db } from '../db';
import { palmReadingsTable } from '../db/schema';
import { type GetUserReadingsInput, type PalmReading } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserPalmReadings = async (input: GetUserReadingsInput): Promise<PalmReading[]> => {
  try {
    // Query palm readings for the specified user, ordered by creation date (newest first)
    const results = await db.select()
      .from(palmReadingsTable)
      .where(eq(palmReadingsTable.user_id, input.user_id))
      .orderBy(desc(palmReadingsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(reading => ({
      ...reading,
      confidence_score: parseFloat(reading.confidence_score)
    }));
  } catch (error) {
    console.error('Failed to fetch user palm readings:', error);
    throw error;
  }
};
