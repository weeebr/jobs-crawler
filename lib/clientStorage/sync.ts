import type { AnalysisRecord } from "../types";
import { REPORT_STORAGE_PREFIX, isBrowser, getLocalStorage } from "./types";
import { analysisStorage as dbStorage } from "../db/storage";
import { getOrCreateUser } from "../db/users";
import { persistAnalysisRecord, loadAnalysisRecord } from "./analysisRecords";
import { dbRecordToClientRecord, clientRecordToDbRecord } from "../analysisStorageUtils";

// Sync utilities for database integration
export async function syncFromDatabaseToClient(): Promise<void> {
  if (!isBrowser()) return;

  try {
    const apiKey = process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
    const user = await getOrCreateUser(apiKey);
    const dbRecords = await dbStorage.getAll(apiKey, 100, 0); // Get recent 100 records

    console.info(`[clientStorage] syncing ${dbRecords.length} records from database to client storage`);

    for (const dbRecord of dbRecords) {
      // The dbRecord is already in client format (from the database conversion)
      // Save to client storage
      persistAnalysisRecord(dbRecord);
    }

    console.info('[clientStorage] database sync completed');
  } catch (error) {
    console.warn('[clientStorage] failed to sync from database:', error);
  }
}

export async function syncClientToDatabase(): Promise<void> {
  if (!isBrowser()) return;

  try {
    const apiKey = process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
    const storage = getLocalStorage();
    if (!storage) return;

    const keys = Object.keys(storage);
    let syncedCount = 0;

    for (const key of keys) {
      if (key.startsWith(REPORT_STORAGE_PREFIX)) {
        const id = parseInt(key.replace(REPORT_STORAGE_PREFIX, ''));
        const record = loadAnalysisRecord(id);

        if (record && record.job && record.llmAnalysis) {
          try {
            // The record is already in client format, save it directly
            // Try to save to database (will update if exists)
            await dbStorage.save(apiKey, record);
            syncedCount++;
          } catch (dbError) {
            console.warn(`[clientStorage] failed to sync record ${id} to database:`, dbError);
          }
        }
      }
    }

    console.info(`[clientStorage] synced ${syncedCount} records from client to database`);
  } catch (error) {
    console.warn('[clientStorage] failed to sync to database:', error);
  }
}
