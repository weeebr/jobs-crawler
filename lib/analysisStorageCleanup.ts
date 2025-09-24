import type { AnalysisRecord } from "./types";

// Utility to clean up invalid timestamps in database records
export async function cleanupInvalidTimestamps(): Promise<number> {
  if (typeof window !== 'undefined') {
    throw new Error('Database cleanup can only be run on server side');
  }

  let cleanedCount = 0;
  try {
    console.info('[cleanupInvalidTimestamps] Starting database cleanup...');

    const { analysisStorage } = await import('./analysisStorageHandler');
    const allRecords = await analysisStorage.list(1000);

    for (const record of allRecords) {
      let needsUpdate = false;
      const updates: Partial<AnalysisRecord> = {};

      // Check if createdAt is valid
      if (record.createdAt && isNaN(record.createdAt)) {
        updates.createdAt = Date.now();
        needsUpdate = true;
      }

      // Check if updatedAt is valid
      if (record.updatedAt && isNaN(record.updatedAt)) {
        updates.updatedAt = Date.now();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await analysisStorage.update(record.id, updates);
        cleanedCount++;
      }
    }

    console.info(`[cleanupInvalidTimestamps] Cleanup completed. Fixed ${cleanedCount} records.`);
  } catch (error) {
    console.error('[cleanupInvalidTimestamps] Cleanup failed:', error);
    throw error;
  }

  return cleanedCount;
}
