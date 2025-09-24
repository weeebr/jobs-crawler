import { db } from './index';
import { analysisRecords } from './schema';
import { desc, eq, and } from 'drizzle-orm';
import { getOrCreateUser } from './users';
import type { AnalysisRecord } from '../types';
import { dbRecordToClientRecord, clientRecordToDbRecord } from '../analysisStorageUtils';

export class AnalysisStorageCrud {
  async existsByUrl(apiKey: string, sourceUrl: string): Promise<boolean> {
    const user = await getOrCreateUser(apiKey);
    const result = await db
      .select()
      .from(analysisRecords)
      .where(and(eq(analysisRecords.sourceUrl, sourceUrl), eq(analysisRecords.userId, user.id)))
      .limit(1);
    return result.length > 0;
  }

  async save(apiKey: string, record: AnalysisRecord): Promise<AnalysisRecord> {
    const user = await getOrCreateUser(apiKey);

    // Convert client record to database format
    const dbRecord = clientRecordToDbRecord(record);

    const newRecord = {
      ...dbRecord,
      userId: user.id,
    };

    // Validation checks
    if (!newRecord.title || newRecord.title.trim() === '') {
      throw new Error(`Title cannot be null or empty: ${newRecord.title}`);
    }

    if (newRecord.company && newRecord.company.toLowerCase() === 'test company') {
      throw new Error('Test company analyses are not allowed in production');
    }

    // Also check for obviously fake test companies
    const suspiciousPatterns = ['test corp', 'test inc', 'test ltd', 'test gmbh', 'fake company'];
    if (newRecord.company && suspiciousPatterns.some(pattern => newRecord.company.toLowerCase() === pattern)) {
      throw new Error('Test company analyses are not allowed in production');
    }

    // Check for duplicate URL - skip if already exists
    if (newRecord.sourceUrl) {
      const exists = await this.existsByUrl(apiKey, newRecord.sourceUrl);
      if (exists) {
        throw new Error(`Job ad with URL ${newRecord.sourceUrl} already exists for this user`);
      }
    }

    const result = await db.insert(analysisRecords).values(newRecord).returning();
    const savedRecord = result[0];

    // Increment user's analysis count
    await this.incrementUserAnalysisCount(apiKey);

    // Convert back to client format
    return dbRecordToClientRecord(savedRecord);
  }

  async getById(apiKey: string, id: number): Promise<AnalysisRecord | null> {
    const user = await getOrCreateUser(apiKey);
    const result = await db.select().from(analysisRecords).where(and(eq(analysisRecords.id, id), eq(analysisRecords.userId, user.id))).limit(1);
    const dbRecord = result[0];
    return dbRecord ? dbRecordToClientRecord(dbRecord) : null;
  }

  async getAll(apiKey: string, limit = 50, offset = 0): Promise<AnalysisRecord[]> {
    const user = await getOrCreateUser(apiKey);
    const dbRecords = await db
      .select()
      .from(analysisRecords)
      .where(eq(analysisRecords.userId, user.id))
      .orderBy(desc(analysisRecords.createdAt))
      .limit(limit)
      .offset(offset);

    return dbRecords.map(dbRecordToClientRecord);
  }

  async list(apiKey: string, limit = 50): Promise<AnalysisRecord[]> {
    return this.getAll(apiKey, limit, 0);
  }

  async update(apiKey: string, id: number, updates: Partial<AnalysisRecord>): Promise<AnalysisRecord | null> {
    const user = await getOrCreateUser(apiKey);

    // Convert client updates to database format
    const dbUpdates = clientRecordToDbRecord(updates as AnalysisRecord);

    const result = await db
      .update(analysisRecords)
      .set({ ...dbUpdates, updatedAt: new Date() })
      .where(and(eq(analysisRecords.id, id), eq(analysisRecords.userId, user.id)))
      .returning();

    const dbRecord = result[0];
    return dbRecord ? dbRecordToClientRecord(dbRecord) : null;
  }

  async delete(apiKey: string, id: number): Promise<boolean> {
    const user = await getOrCreateUser(apiKey);
    const result = await db
      .delete(analysisRecords)
      .where(and(eq(analysisRecords.id, id), eq(analysisRecords.userId, user.id)));
    return result.changes > 0;
  }

  async remove(apiKey: string, id: number): Promise<boolean> {
    return this.delete(apiKey, id);
  }

  async clear(apiKey: string): Promise<void> {
    const user = await getOrCreateUser(apiKey);
    await db
      .delete(analysisRecords)
      .where(eq(analysisRecords.userId, user.id));
  }

  private async incrementUserAnalysisCount(apiKey: string): Promise<void> {
    // Import dynamically to avoid circular dependency
    const { incrementUserAnalysisCount } = await import('./users');
    await incrementUserAnalysisCount(apiKey);
  }
}
