import { db } from './index';
import { analysisRecords } from './schema';
import { desc, eq, and } from 'drizzle-orm';
import { getOrCreateUser, incrementUserAnalysisCount } from './users';
import type { AnalysisRecord, NewAnalysisRecord } from './schema';

// Analysis Records Storage (User-scoped)
export const analysisStorage = {
  // Save a new analysis record for a specific user
  save: async (apiKey: string, record: Omit<NewAnalysisRecord, 'userId'>): Promise<AnalysisRecord> => {
    const user = await getOrCreateUser(apiKey);

    const newRecord: NewAnalysisRecord = {
      ...record,
      userId: user.id,
    };

    // Final check for null title before insertion
    if (!newRecord.title || newRecord.title.trim() === '') {
      console.error(`[db/analysisStorage] ERROR - Title is null or empty:`, newRecord.title);
      throw new Error(`Title cannot be null or empty: ${newRecord.title}`);
    }

    const result = await db.insert(analysisRecords).values(newRecord).returning();
    const savedRecord = result[0];

    // Increment user's analysis count
    await incrementUserAnalysisCount(apiKey);

    return savedRecord;
  },

  // Get analysis by ID (user-scoped)
  getById: async (apiKey: string, id: number): Promise<AnalysisRecord | null> => {
    const user = await getOrCreateUser(apiKey);
    const result = await db
      .select()
      .from(analysisRecords)
      .where(and(eq(analysisRecords.id, id), eq(analysisRecords.userId, user.id)))
      .limit(1);
    return result[0] || null;
  },

  // Get all analyses for a user with pagination
  getAll: async (apiKey: string, limit = 50, offset = 0): Promise<AnalysisRecord[]> => {
    const user = await getOrCreateUser(apiKey);
    return await db
      .select()
      .from(analysisRecords)
      .where(eq(analysisRecords.userId, user.id))
      .orderBy(desc(analysisRecords.createdAt))
      .limit(limit)
      .offset(offset);
  },

  // Get recent analyses for a user (last N)
  getRecent: async (apiKey: string, count = 10): Promise<AnalysisRecord[]> => {
    const user = await getOrCreateUser(apiKey);
    return await db
      .select()
      .from(analysisRecords)
      .where(eq(analysisRecords.userId, user.id))
      .orderBy(desc(analysisRecords.createdAt))
      .limit(count);
  },

  // Search by company name (user-scoped)
  searchByCompany: async (apiKey: string, company: string): Promise<AnalysisRecord[]> => {
    const user = await getOrCreateUser(apiKey);
    return await db
      .select()
      .from(analysisRecords)
      .where(and(eq(analysisRecords.userId, user.id), eq(analysisRecords.company, company)))
      .orderBy(desc(analysisRecords.createdAt));
  },

  // Filter by status (user-scoped)
  getByStatus: async (apiKey: string, status: 'interested' | 'applied'): Promise<AnalysisRecord[]> => {
    const user = await getOrCreateUser(apiKey);
    return await db
      .select()
      .from(analysisRecords)
      .where(and(eq(analysisRecords.userId, user.id), eq(analysisRecords.status, status)))
      .orderBy(desc(analysisRecords.createdAt));
  },

  // Get analyses from current session (marked as new) for user
  getNewThisRun: async (apiKey: string): Promise<AnalysisRecord[]> => {
    const user = await getOrCreateUser(apiKey);
    return await db
      .select()
      .from(analysisRecords)
      .where(and(eq(analysisRecords.userId, user.id), eq(analysisRecords.isNewThisRun, true)))
      .orderBy(desc(analysisRecords.createdAt));
  },

  // Update analysis record (user-scoped)
  update: async (apiKey: string, id: number, updates: Partial<Omit<NewAnalysisRecord, 'userId'>>): Promise<AnalysisRecord | null> => {
    const user = await getOrCreateUser(apiKey);
    const result = await db
      .update(analysisRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(analysisRecords.id, id), eq(analysisRecords.userId, user.id)))
      .returning();
    return result[0] || null;
  },

  // Delete analysis record (user-scoped)
  delete: async (apiKey: string, id: number): Promise<boolean> => {
    const user = await getOrCreateUser(apiKey);
    const result = await db
      .delete(analysisRecords)
      .where(and(eq(analysisRecords.id, id), eq(analysisRecords.userId, user.id)));
    return result.changes > 0;
  },

  // Get user-specific statistics
  getStats: async (apiKey: string) => {
    const user = await getOrCreateUser(apiKey);
    const total = await db
      .select({ count: analysisRecords.id })
      .from(analysisRecords)
      .where(eq(analysisRecords.userId, user.id));

    const interested = await db
      .select({ count: analysisRecords.id })
      .from(analysisRecords)
      .where(and(eq(analysisRecords.userId, user.id), eq(analysisRecords.status, 'interested')));

    const applied = await db
      .select({ count: analysisRecords.id })
      .from(analysisRecords)
      .where(and(eq(analysisRecords.userId, user.id), eq(analysisRecords.status, 'applied')));

    const avgScore = await db
      .select({ avg: analysisRecords.matchScore })
      .from(analysisRecords)
      .where(eq(analysisRecords.userId, user.id));

    return {
      total: total[0]?.count || 0,
      interested: interested[0]?.count || 0,
      applied: applied[0]?.count || 0,
      averageScore: avgScore[0]?.avg || 0,
      userId: user.id,
      memberSince: user.createdAt,
    };
  },
};