import { db } from './index';
import { analysisFeedback, jobSearches, analysisRecords, cvProfiles } from './schema';

// Utility functions for data migration and cleanup
export const dbUtils = {
  // Clear all data (useful for testing)
  clearAllData: async (): Promise<void> => {
    await db.delete(analysisFeedback);
    await db.delete(jobSearches);
    await db.delete(analysisRecords);
    await db.delete(cvProfiles);
  },

  // Get database info
  getInfo: async () => {
    const tables = await db.all(`
      SELECT name, COUNT(*) as count
      FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      GROUP BY name
    `);

    return {
      tables: tables.map(t => ({ name: t.name, count: t.count })),
      totalRecords: tables.reduce((sum, t) => sum + (t.count || 0), 0),
    };
  },

  // Optimize database
  optimize: async (): Promise<void> => {
    db.pragma('vacuum');
    db.pragma('reindex');
  },
};
