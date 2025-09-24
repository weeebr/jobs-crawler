import type { AnalysisRecord } from "../types";
import { REPORT_STORAGE_PREFIX, isBrowser, getLocalStorage } from "./types";
import { analysisStorage as dbStorage } from "../db/storage";
import { getOrCreateUser } from "../db/users";
import { persistAnalysisRecord, loadAnalysisRecord } from "./analysisRecords";

// Sync utilities for database integration
export async function syncFromDatabaseToClient(): Promise<void> {
  if (!isBrowser()) return;

  try {
    const apiKey = process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
    const user = await getOrCreateUser(apiKey);
    const dbRecords = await dbStorage.getAll(apiKey, 100); // Get recent 100 records

    console.info(`[clientStorage] syncing ${dbRecords.length} records from database to client storage`);

    for (const dbRecord of dbRecords) {
      // Convert DB record to client format
      const clientRecord = {
        id: dbRecord.id,
        job: {
          title: dbRecord.title,
          company: dbRecord.company,
          description: dbRecord.description,
          publishedAt: dbRecord.publishedAt,
          location: dbRecord.location,
          workload: dbRecord.workload,
          duration: dbRecord.duration,
          size: dbRecord.size,
          companySize: dbRecord.companySize,
          stack: dbRecord.stack,
          sourceUrl: dbRecord.sourceUrl,
          sourceType: dbRecord.sourceType,
          fetchedAt: dbRecord.createdAt,
          sourceDomain: dbRecord.sourceUrl ? new URL(dbRecord.sourceUrl).hostname : undefined,
        },
        cv: {
          roles: [],
          skills: [],
          projects: [],
          education: [],
          keywords: [],
        }, // Note: CV data not stored in DB analysis records yet
        llmAnalysis: {
          matchScore: dbRecord.matchScore,
          reasoning: dbRecord.reasoning,
          letters: {},
          analyzedAt: dbRecord.createdAt,
          analysisVersion: "1.0",
        },
        userInteractions: {
          status: dbRecord.status,
          isNewThisRun: dbRecord.isNewThisRun,
          interactionCount: 0,
        },
        createdAt: dbRecord.createdAt,
        updatedAt: dbRecord.updatedAt,
      };

      // Save to client storage
      persistAnalysisRecord(clientRecord);
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

        if (record) {
          try {
            // Try to save to database (will update if exists)
            await dbStorage.save(apiKey, {
              title: record.job.title,
              company: record.job.company,
              description: record.job.description,
              publishedAt: record.job.publishedAt,
              location: record.job.location,
              workload: record.job.workload,
              duration: record.job.duration,
              size: record.job.size,
              companySize: record.job.companySize,
              stack: record.job.stack,
              matchScore: record.llmAnalysis.matchScore,
              reasoning: record.llmAnalysis.reasoning,
              status: record.userInteractions.status,
              isNewThisRun: record.userInteractions.isNewThisRun || false,
              sourceUrl: record.job.sourceUrl,
              sourceType: record.job.sourceType,
            });
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
