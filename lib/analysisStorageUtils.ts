import type { AnalysisRecord } from "./types";
import type { DbAnalysisRecord } from "./db/schema";

// Get API key from environment - this should be set by middleware or from user session
export async function getCurrentApiKey(): Promise<string> {
  // For now, use a default key. In production, this should come from authenticated user
  return process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
}

// Helper function to parse reasoning field - handles both old string format and new JSON format
export function parseReasoningField(reasoning: string): string[] {
  if (!reasoning) return [];

  try {
    // Try to parse as JSON first (new format)
    const parsed = JSON.parse(reasoning);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    // If not an array, treat as old string format and wrap in array
    return [reasoning];
  } catch {
    // If JSON parsing fails, treat as old string format and wrap in array
    return [reasoning];
  }
}

// Convert between client and database record formats
export function clientRecordToDbRecord(record: AnalysisRecord): Omit<DbAnalysisRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  return {
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
    reasoning: JSON.stringify(record.llmAnalysis.reasoning), // Convert array to JSON string
    status: record.userInteractions.status,
    isNewThisRun: record.userInteractions.isNewThisRun || false,
    sourceUrl: record.job.sourceUrl,
    sourceType: record.job.sourceType,
  };
}

export function dbRecordToClientRecord(record: DbAnalysisRecord): AnalysisRecord {
  // Helper function to convert Date to Unix timestamp with validation
  const dateToTimestamp = (date: Date | null | undefined): number => {
    if (!date) return Date.now();
    if (date instanceof Date) {
      return date.getTime();
    }
    // Try to create a valid Date object
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.warn('[dateToTimestamp] Invalid date value:', date, 'using current time');
      return Date.now();
    }
    return parsedDate.getTime();
  };

  try {
    const clientRecord = {
      id: record.id,
      job: {
        title: record.title,
        company: record.company,
        description: record.description || undefined,
        publishedAt: record.publishedAt || undefined,
        location: record.location || undefined,
        workload: record.workload || undefined,
        duration: record.duration || undefined,
        size: record.size || undefined,
        companySize: record.companySize || undefined,
        stack: record.stack,
        sourceUrl: record.sourceUrl && record.sourceUrl.trim() ? record.sourceUrl : undefined,
        sourceType: record.sourceType || undefined,
        fetchedAt: dateToTimestamp(record.createdAt),
        sourceDomain: record.sourceUrl && record.sourceUrl.trim() ? new URL(record.sourceUrl).hostname : undefined,
      },
      cv: {
        roles: [],
        skills: [],
        projects: [],
        education: [],
        keywords: [],
      }, // Note: CV data not stored in DB analysis records yet
      llmAnalysis: {
        matchScore: record.matchScore,
        reasoning: parseReasoningField(record.reasoning || '[]'), // Parse JSON string back to array
        letters: {},
        analyzedAt: dateToTimestamp(record.createdAt),
        analysisVersion: "1.0",
      },
      userInteractions: {
        status: record.status || undefined,
        isNewThisRun: record.isNewThisRun,
        interactionCount: 0,
      },
      createdAt: dateToTimestamp(record.createdAt),
      updatedAt: dateToTimestamp(record.updatedAt),
    };

    return analysisRecordSchema.parse(clientRecord);
  } catch (error) {
    console.error('[dbRecordToClientRecord] Failed to transform record ID:', record.id, 'Error:', error);
    console.error('[dbRecordToClientRecord] Record data:', JSON.stringify(record, null, 2));
    throw new Error(`Failed to transform database record: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// URL-based filtering for job ads
export function shouldSkipJobUrl(url: string): { skip: boolean; reason?: string } {
  if (!url || typeof url !== 'string') {
    return { skip: true, reason: 'Invalid URL' };
  }

  try {
    const urlObj = new URL(url);

    // Skip non-jobs.ch URLs (for now, we only process jobs.ch)
    if (!urlObj.hostname.includes('jobs.ch')) {
      return { skip: true, reason: 'Non-jobs.ch domain' };
    }

    // Skip URLs that don't match the expected job detail pattern
    if (!urlObj.pathname.includes('/vacancies/detail/')) {
      return { skip: true, reason: 'Not a job detail page' };
    }

    // Skip URLs with invalid or missing job IDs
    const jobIdMatch = urlObj.pathname.match(/\/vacancies\/detail\/([^\/]+)/);
    if (!jobIdMatch || !jobIdMatch[1] || jobIdMatch[1].length < 10) {
      return { skip: true, reason: 'Invalid or missing job ID' };
    }

    // Skip duplicate URLs (this check will be done by the caller)
    return { skip: false };
  } catch (error) {
    return { skip: true, reason: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Validate and normalize timestamp fields for database operations
export function validateTimestampFields(record: { createdAt?: unknown; updatedAt?: unknown }): void {
  if (record.createdAt && !(record.createdAt instanceof Date)) {
    if (isNaN(new Date(record.createdAt).getTime())) {
      console.warn('[validateTimestampFields] Invalid createdAt value, using current time:', record.createdAt);
      record.createdAt = new Date();
    } else {
      record.createdAt = new Date(record.createdAt);
    }
  }

  if (record.updatedAt && !(record.updatedAt instanceof Date)) {
    if (isNaN(new Date(record.updatedAt).getTime())) {
      console.warn('[validateTimestampFields] Invalid updatedAt value, using current time:', record.updatedAt);
      record.updatedAt = new Date();
    } else {
      record.updatedAt = new Date(record.updatedAt);
    }
  }
}


// Import required functions
import { analysisRecordSchema } from "./schemas";
