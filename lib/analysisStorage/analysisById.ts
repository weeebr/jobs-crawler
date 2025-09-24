import type { AnalysisRecord } from "../types";
import { initializeStorage } from "../analysisStorageInit";
import { dbRecordToClientRecord, getCurrentApiKey } from "../analysisStorageUtils";
import { getStorageState } from "../analysisStorageState";

export const analysisById = {
  // Get analysis by ID
  async getById(id: number): Promise<AnalysisRecord | null> {
    if (typeof window !== 'undefined') {
      throw new Error('Database storage is not available on client side. This operation should be called from server-side API routes.');
    }

    const state = getStorageState();

    // Initialize storage if not already done
    if (!state.isInitialized || state.initializationError) {
      await initializeStorage();
      const updatedState = getStorageState();
      if (updatedState.initializationError) {
        throw new Error(`Database initialization failed: ${updatedState.initializationError.message}`);
      }
    }

    const currentState = getStorageState();
    if (!currentState.dbStorage) {
      throw new Error('Database storage not available after initialization');
    }

    // Get directly from database
    const apiKey = await getCurrentApiKey();
    const dbRecord = await currentState.dbStorage.getById(apiKey, id);

    if (dbRecord) {
      return dbRecordToClientRecord(dbRecord);
    }

    return null;
  },
};
