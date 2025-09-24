import { and, eq, desc, inArray, like } from 'drizzle-orm';
import type { AnalysisRecordsTable, UsersTable } from './analysisStorageTypes';
import type { AnalysisRecord } from './db/schema';
import { validateTimestampFields } from './analysisStorageUtils';

// Helper function to create storage interface
export function createStorageInterface(
  db: ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>,
  analysisRecords: AnalysisRecordsTable,
  users: UsersTable,
  hashApiKey: (apiKey: string) => string,
  getOrCreateUser: (apiKey: string) => Promise<{ id: number; createdAt: Date; apiKeyHash: string; lastActiveAt: Date; totalAnalyses: number | null; preferredModel: string | null; }>
) {
  return {
    save: async (apiKey: string, record: Omit<AnalysisRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const user = await getOrCreateUser(apiKey);

      // Validate timestamp fields to prevent getTime() errors
      const validatedRecord = { ...record };
      validateTimestampFields(validatedRecord);

      const newRecord = { ...validatedRecord, userId: user.id };
      const result = await db.insert(analysisRecords).values(newRecord).returning();
      return result[0];
    },

    getById: async (apiKey: string, id: number) => {
      const user = await getOrCreateUser(apiKey);
      const result = await db
        .select()
        .from(analysisRecords)
        .where(and(eq(analysisRecords.id, id), eq(analysisRecords.userId, user.id)))
        .limit(1);
      return result[0] || null;
    },

    getAll: async (apiKey: string, limit = 50) => {
      console.info('[db-storage-interface] getAll called with API key:', apiKey.substring(0, 8) + '...');
      const user = await getOrCreateUser(apiKey);
      console.info('[db-storage-interface] querying for user ID:', user.id);

      const records = await db
        .select()
        .from(analysisRecords)
        .where(eq(analysisRecords.userId, user.id))
        .orderBy(desc(analysisRecords.createdAt))
        .limit(limit);

      console.info('[db-storage-interface] found', records.length, 'records for user', user.id);
      return records;
    },

    update: async (apiKey: string, id: number, updates: Partial<Omit<AnalysisRecord, 'id' | 'userId' | 'createdAt'>>) => {
      const user = await getOrCreateUser(apiKey);

      // Validate timestamp fields to prevent getTime() errors
      const validatedUpdates = { ...updates };
      validateTimestampFields(validatedUpdates);

      const result = await db
        .update(analysisRecords)
        .set({ ...validatedUpdates, updatedAt: new Date() })
        .where(and(eq(analysisRecords.id, id), eq(analysisRecords.userId, user.id)))
        .returning();
      return result[0] || null;
    },

    delete: async (apiKey: string, id: number) => {
      const user = await getOrCreateUser(apiKey);
      const result = await db
        .delete(analysisRecords)
        .where(and(eq(analysisRecords.id, id), eq(analysisRecords.userId, user.id)));
      return result.changes > 0;
    },

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

      return {
        total: total[0]?.count || 0,
        interested: interested[0]?.count || 0,
        applied: applied[0]?.count || 0,
        averageScore: 0,
        userId: user.id,
        memberSince: user.createdAt.getTime(),
      };
    },

    getRecent: async (apiKey: string, count = 10) => {
      const user = await getOrCreateUser(apiKey);
      return await db
        .select()
        .from(analysisRecords)
        .where(eq(analysisRecords.userId, user.id))
        .orderBy(desc(analysisRecords.createdAt))
        .limit(count);
    },

    getNewThisRun: async (apiKey: string) => {
      const user = await getOrCreateUser(apiKey);
      return await db
        .select()
        .from(analysisRecords)
        .where(and(eq(analysisRecords.userId, user.id), eq(analysisRecords.isNewThisRun, true)))
        .orderBy(desc(analysisRecords.createdAt));
    },

    markAsNewThisRun: async (apiKey: string, ids: number[]) => {
      const user = await getOrCreateUser(apiKey);
      await db
        .update(analysisRecords)
        .set({ isNewThisRun: true })
        .where(and(eq(analysisRecords.userId, user.id), inArray(analysisRecords.id, ids)));
    },

    searchByCompany: async (apiKey: string, company: string) => {
      const user = await getOrCreateUser(apiKey);
      return await db
        .select()
        .from(analysisRecords)
        .where(and(eq(analysisRecords.userId, user.id), like(analysisRecords.company, `%${company}%`)))
        .orderBy(desc(analysisRecords.createdAt));
    },

    getByStatus: async (apiKey: string, status: 'interested' | 'applied') => {
      const user = await getOrCreateUser(apiKey);
      return await db
        .select()
        .from(analysisRecords)
        .where(and(eq(analysisRecords.userId, user.id), eq(analysisRecords.status, status)))
        .orderBy(desc(analysisRecords.createdAt));
    },

    clear: async () => {
      await db.delete(analysisRecords);
    }
  };
}

// Helper function to create user manager
export function createUserManager(
  db: ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>,
  users: UsersTable,
  hashApiKey: (apiKey: string) => string
) {
  return async (apiKey: string) => {
    const apiKeyHash = hashApiKey(apiKey);
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.apiKeyHash, apiKeyHash))
      .limit(1);

    if (existingUser.length > 0) {
      return existingUser[0];
    }

    const newUser = await db.insert(users).values({
      apiKeyHash,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      totalAnalyses: 0,
      preferredModel: 'gpt-4o-mini',
    }).returning();

    return newUser[0];
  };
}
