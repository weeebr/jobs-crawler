import { db } from './index';
import { jobSearches } from './schema';
import { desc, eq, and } from 'drizzle-orm';
import { getOrCreateUser } from './users';
import type { JobSearch, NewJobSearch } from './schema';

// Job Search Sessions Storage (User-scoped)
export const jobSearchStorage = {
  save: async (apiKey: string, search: Omit<NewJobSearch, 'userId'>): Promise<JobSearch> => {
    const user = await getOrCreateUser(apiKey);

    const newSearch: NewJobSearch = {
      ...search,
      userId: user.id,
    };

    const result = await db.insert(jobSearches).values(newSearch).returning();
    return result[0];
  },

  getById: async (apiKey: string, id: number): Promise<JobSearch | null> => {
    const user = await getOrCreateUser(apiKey);
    const result = await db
      .select()
      .from(jobSearches)
      .where(and(eq(jobSearches.id, id), eq(jobSearches.userId, user.id)))
      .limit(1);
    return result[0] || null;
  },

  getAll: async (apiKey: string): Promise<JobSearch[]> => {
    const user = await getOrCreateUser(apiKey);
    return await db
      .select()
      .from(jobSearches)
      .where(eq(jobSearches.userId, user.id))
      .orderBy(desc(jobSearches.createdAt));
  },

  update: async (apiKey: string, id: number, updates: Partial<Omit<NewJobSearch, 'userId'>>): Promise<JobSearch | null> => {
    const user = await getOrCreateUser(apiKey);
    const result = await db
      .update(jobSearches)
      .set({ ...updates, completedAt: updates.status === 'completed' ? new Date() : undefined })
      .where(and(eq(jobSearches.id, id), eq(jobSearches.userId, user.id)))
      .returning();
    return result[0] || null;
  },
};