import { db } from './index';
import { analysisRecords } from './schema';
import { desc, eq, and, inArray } from 'drizzle-orm';
import { getOrCreateUser } from './users';
import type { AnalysisRecord } from '../types';
import { dbRecordToClientRecord } from '../analysisStorageUtils';

export class AnalysisStorageStats {
  async getStats(apiKey: string) {
    const user = await getOrCreateUser(apiKey);
    const [total, interested, applied, avgScore] = await Promise.all([
      db.select({ count: analysisRecords.id }).from(analysisRecords).where(eq(analysisRecords.userId, user.id)),
      db.select({ count: analysisRecords.id }).from(analysisRecords).where(and(eq(analysisRecords.userId, user.id), eq(analysisRecords.status, 'interested'))),
      db.select({ count: analysisRecords.id }).from(analysisRecords).where(and(eq(analysisRecords.userId, user.id), eq(analysisRecords.status, 'applied'))),
      db.select({ avg: analysisRecords.matchScore }).from(analysisRecords).where(eq(analysisRecords.userId, user.id))
    ]);

    return {
      total: total[0]?.count || 0,
      interested: interested[0]?.count || 0,
      applied: applied[0]?.count || 0,
      averageScore: avgScore[0]?.avg || 0,
      userId: user.id,
      memberSince: user.createdAt,
    };
  }

  async markAsNewThisRun(apiKey: string, ids: number[]): Promise<void> {
    const user = await getOrCreateUser(apiKey);
    await db
      .update(analysisRecords)
      .set({
        isNewThisRun: true,
        updatedAt: new Date()
      })
      .where(and(
        eq(analysisRecords.userId, user.id),
        inArray(analysisRecords.id, ids)
      ));
  }

  async getNewThisRun(apiKey: string): Promise<AnalysisRecord[]> {
    const user = await getOrCreateUser(apiKey);
    const records = await db
      .select()
      .from(analysisRecords)
      .where(and(eq(analysisRecords.userId, user.id), eq(analysisRecords.isNewThisRun, true)))
      .orderBy(desc(analysisRecords.createdAt));

    return records.map(dbRecordToClientRecord);
  }

  async clearAll(): Promise<void> {
    const defaultApiKey = process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
    return this.clear(defaultApiKey);
  }

  private async clear(apiKey: string): Promise<void> {
    const user = await getOrCreateUser(apiKey);
    await db
      .delete(analysisRecords)
      .where(eq(analysisRecords.userId, user.id));
  }
}
