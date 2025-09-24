import { db } from './index';
import { analysisRecords } from './schema';
import { desc, eq, and } from 'drizzle-orm';
import { getOrCreateUser } from './users';
import type { AnalysisRecord } from '../types';
import { dbRecordToClientRecord } from '../analysisStorageUtils';

export class AnalysisStorageSearch {
  async searchByCompany(apiKey: string, company: string): Promise<AnalysisRecord[]> {
    const user = await getOrCreateUser(apiKey);
    const records = await db
      .select()
      .from(analysisRecords)
      .where(and(eq(analysisRecords.userId, user.id), eq(analysisRecords.company, company)))
      .orderBy(desc(analysisRecords.createdAt));

    return records.map(dbRecordToClientRecord);
  }

  async getByStatus(apiKey: string, status: 'interested' | 'applied'): Promise<AnalysisRecord[]> {
    const user = await getOrCreateUser(apiKey);
    const records = await db
      .select()
      .from(analysisRecords)
      .where(and(eq(analysisRecords.userId, user.id), eq(analysisRecords.status, status)))
      .orderBy(desc(analysisRecords.createdAt));

    return records.map(dbRecordToClientRecord);
  }

  async getRecent(apiKey: string, count = 10): Promise<AnalysisRecord[]> {
    const user = await getOrCreateUser(apiKey);
    const records = await db
      .select()
      .from(analysisRecords)
      .where(eq(analysisRecords.userId, user.id))
      .orderBy(desc(analysisRecords.createdAt))
      .limit(count);

    return records.map(dbRecordToClientRecord);
  }
}
