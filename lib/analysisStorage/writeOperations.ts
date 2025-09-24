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

    const dbRecordData = {
      // Job data
      title: record.job.title,
      company: record.job.company,
      description: null, // Job parsing doesn't extract description, use null
      stack: record.job.stack,
      publishedAt: record.job.publishedAt || null,
      location: record.job.location || null,
      workload: record.job.workload || null,
      duration: record.job.duration || null,
      size: record.job.size || null,
      companySize: record.job.companySize || null,
      sourceUrl: record.job.sourceUrl || null,
      sourceType: 'single-job',

      // LLM analysis
      matchScore: record.llmAnalysis.matchScore,
      reasoning: JSON.stringify(record.llmAnalysis.reasoning), // Serialize array to JSON string

      // User interactions
      status: record.userInteractions.status || null,
      isNewThisRun: record.userInteractions.isNewThisRun,

      // Timestamps
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    };

    // Add explicit title validation before database save
    if (!dbRecordData.title || dbRecordData.title.trim() === '') {
      console.error(`[writeOperations] ERROR - Title is null or empty before database save:`, {
        title: dbRecordData.title,
        recordTitle: record.job.title,
        company: record.job.company,
      });
      throw new Error(`Cannot save record with null/empty title: ${dbRecordData.title}`);
    }

    // Additional safeguard: if title is still somehow empty, generate a fallback
    if (!dbRecordData.title.trim()) {
      dbRecordData.title = `Job at ${record.job.company || 'Unknown Company'}`;
      console.warn(`[writeOperations] WARN - Generated fallback title: "${dbRecordData.title}"`);
    }

    const dbRecord = await currentState.dbStorage.save(apiKey, dbRecordData);
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
    const dbUpdates = {
      title: updates.job?.title,
      company: updates.job?.company,
      description: undefined, // Job type doesn't have description field
      matchScore: updates.llmAnalysis?.matchScore,
      reasoning: updates.llmAnalysis?.reasoning ? JSON.stringify(updates.llmAnalysis.reasoning) : undefined,
      status: updates.userInteractions?.status,
      isNewThisRun: updates.userInteractions?.isNewThisRun,
      updatedAt: new Date(),
    };

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(dbUpdates).filter(([_, value]) => value !== undefined)
    );

    const dbRecord = await currentState.dbStorage.update(apiKey, id, cleanUpdates);
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
