import type { AnalysisRecord } from "../types";
import { initializeStorage } from "../analysisStorageInit";
import { dbRecordToClientRecord, getCurrentApiKey } from "../analysisStorageUtils";
import { getStorageState } from "../analysisStorageState";

export const analysisList = {
  // List all analyses
  async list(limit?: number): Promise<AnalysisRecord[]> {
    if (typeof window !== 'undefined') {
      throw new Error('Database storage is not available on client side. This operation should be called from server-side API routes.');
    }

    console.info('[db-storage] list() called with limit:', limit);

    const state = getStorageState();

    // Try to initialize storage if not already done
    if (!state.isInitialized && !state.initializationError) {
      console.info('[db-storage] initializing storage...');
      try {
        await initializeStorage();
        console.info('[db-storage] storage initialized successfully');
      } catch (error) {
        console.warn('[db-storage] Database initialization failed, using fallback:', error);
        // If initialization fails, return empty array instead of throwing
        return [];
      }
    }

    const currentState = getStorageState();
    if (!currentState.dbStorage) {
      console.warn('[db-storage] Database storage not available, returning empty array');
      return [];
    }

    try {
      // Get directly from database
      const apiKey = await getCurrentApiKey();
      console.info('[db-storage] using API key:', apiKey.substring(0, 8) + '...');

      const dbRecords = await currentState.dbStorage.getAll(apiKey, limit || 50);
      console.info('[db-storage] getAll returned', dbRecords.length, 'raw records');

      const records: AnalysisRecord[] = [];
      const errors: string[] = [];

      for (const dbRecord of dbRecords) {
        try {
          const clientRecord = dbRecordToClientRecord(dbRecord);
          records.push(clientRecord);
        } catch (error) {
          const errorMsg = `Failed to transform record ${dbRecord.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('[db-storage] ' + errorMsg);
          errors.push(errorMsg);
        }
      }

      console.info('[db-storage] successfully transformed', records.length, 'records');
      if (errors.length > 0) {
        console.error('[db-storage] failed to transform', errors.length, 'records:', errors);
      }

      return records;
    } catch (error) {
      console.error('[db-storage] Error fetching from database, returning empty array:', error);
      return [];
    }
  },
};
