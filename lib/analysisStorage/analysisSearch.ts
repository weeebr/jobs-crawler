import type { AnalysisRecord } from "../types";
import { initializeStorage } from "../analysisStorageInit";
import { dbRecordToClientRecord, getCurrentApiKey } from "../analysisStorageUtils";
import { getStorageState } from "../analysisStorageState";

export const analysisSearch = {
  // Search by company name
  async searchByCompany(company: string): Promise<AnalysisRecord[]> {
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

    const apiKey = await getCurrentApiKey();
    const dbRecords = await currentState.dbStorage.searchByCompany(apiKey, company);
    return dbRecords.map(dbRecordToClientRecord);
  },

  // Get by status
  async getByStatus(status: 'interested' | 'applied'): Promise<AnalysisRecord[]> {
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

    const apiKey = await getCurrentApiKey();
    const dbRecords = await currentState.dbStorage.getByStatus(apiKey, status);
    return dbRecords.map(dbRecordToClientRecord);
  },

  // Get "new this run" analyses from database
  async getNewThisRun(): Promise<AnalysisRecord[]> {
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

    const apiKey = await getCurrentApiKey();
    const dbRecords = await currentState.dbStorage.getNewThisRun(apiKey);
    return dbRecords.map(dbRecordToClientRecord);
  },
};
