import { db } from './index';
import { cvProfiles } from './schema';
import { desc, eq, and } from 'drizzle-orm';
import { getOrCreateUser } from './users';
import type { CvProfile, NewCvProfile } from './schema';

// CV Profiles Storage (User-scoped)
export const cvProfileStorage = {
  save: async (apiKey: string, profile: Omit<NewCvProfile, 'userId'>): Promise<CvProfile> => {
    const user = await getOrCreateUser(apiKey);

    const newProfile: NewCvProfile = {
      ...profile,
      userId: user.id,
    };

    const result = await db.insert(cvProfiles).values(newProfile).returning();
    return result[0];
  },

  getActive: async (apiKey: string): Promise<CvProfile | null> => {
    const user = await getOrCreateUser(apiKey);
    const result = await db
      .select()
      .from(cvProfiles)
      .where(and(eq(cvProfiles.userId, user.id), eq(cvProfiles.isActive, true)))
      .orderBy(desc(cvProfiles.updatedAt))
      .limit(1);
    return result[0] || null;
  },

  getAll: async (apiKey: string): Promise<CvProfile[]> => {
    const user = await getOrCreateUser(apiKey);
    return await db
      .select()
      .from(cvProfiles)
      .where(eq(cvProfiles.userId, user.id))
      .orderBy(desc(cvProfiles.updatedAt));
  },

  update: async (apiKey: string, id: number, updates: Partial<Omit<NewCvProfile, 'userId'>>): Promise<CvProfile | null> => {
    const user = await getOrCreateUser(apiKey);
    const result = await db
      .update(cvProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(cvProfiles.id, id), eq(cvProfiles.userId, user.id)))
      .returning();
    return result[0] || null;
  },

  setActive: async (apiKey: string, id: number): Promise<void> => {
    const user = await getOrCreateUser(apiKey);

    // Deactivate all user's profiles
    await db
      .update(cvProfiles)
      .set({ isActive: false })
      .where(and(eq(cvProfiles.userId, user.id), eq(cvProfiles.isActive, true)));

    // Activate the selected one
    await db
      .update(cvProfiles)
      .set({ isActive: true })
      .where(and(eq(cvProfiles.id, id), eq(cvProfiles.userId, user.id)));
  },
};