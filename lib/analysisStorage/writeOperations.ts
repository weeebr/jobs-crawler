import type { AnalysisRecord } from "../types";
import { initializeStorage } from "../analysisStorageInit";
import { clientRecordToDbRecord, dbRecordToClientRecord, getCurrentApiKey } from "../analysisStorageUtils";
import { getStorageState } from "../analysisStorageState";

// Helper function to ensure storage is initialized and available
async function ensureStorageAvailable(): Promise<void> {
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
}

export const writeOperations = {
  // Save new analysis record
  async save(record: AnalysisRecord): Promise<AnalysisRecord> {
    await ensureStorageAvailable();

    const currentState = getStorageState();

    // Additional safety check (should never be null after ensureStorageAvailable)
    if (!currentState.dbStorage) {
      throw new Error('Database storage unexpectedly unavailable');
    }

    // Save to database
    const apiKey = await getCurrentApiKey();

    // Create a database record from the client record
    // The storage interface expects the full record structure
    const dbRecord = await currentState.dbStorage.save(apiKey, record);
    const clientRecord = dbRecordToClientRecord(dbRecord);

    console.info(`[db-storage] saved record ${clientRecord.id} to database`);
    return clientRecord;
  },

  // Update analysis record
  async update(id: number, updates: Partial<AnalysisRecord>): Promise<AnalysisRecord | null> {
    await ensureStorageAvailable();

    const currentState = getStorageState();

    // Additional safety check (should never be null after ensureStorageAvailable)
    if (!currentState.dbStorage) {
      throw new Error('Database storage unexpectedly unavailable');
    }

    const apiKey = await getCurrentApiKey();

    // Convert partial updates to database format using existing utility
    const dbUpdates = clientRecordToDbRecord(updates as AnalysisRecord);

    const dbRecord = await currentState.dbStorage.update(apiKey, id, dbUpdates);
    if (dbRecord) {
      return dbRecordToClientRecord(dbRecord);
    }

    return null;
  },

  // Delete analysis record
  async remove(id: number): Promise<boolean> {
    await ensureStorageAvailable();

    const currentState = getStorageState();

    // Additional safety check (should never be null after ensureStorageAvailable)
    if (!currentState.dbStorage) {
      throw new Error('Database storage unexpectedly unavailable');
    }

    // Delete directly from database
    const apiKey = await getCurrentApiKey();
    const dbDeleted = await currentState.dbStorage.delete(apiKey, id);

    if (dbDeleted) {
      console.info(`[db-storage] deleted record ${id} from database`);
      return true;
    }

    console.warn(`[db-storage] failed to delete record ${id} from database`);
    return false;
  },

  // Clear all analyses
  async clear(): Promise<void> {
    await ensureStorageAvailable();

    const currentState = getStorageState();

    // Clear from database (user-scoped)
    const apiKey = await getCurrentApiKey();
    // Note: We don't have a clearAll method in dbStorage, so we'll skip DB clear for now
    console.info('[db-storage] DB clear not implemented, skipping');
  },
};
