import type { AnalysisRecord } from "./types";
import type { AnalysisRecord as DbAnalysisRecord } from "./db/schema";

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
      // If array is empty, provide a default reasoning
      if (parsed.length === 0) {
        return ["Analysis completed but no detailed reasoning available."];
      }
      return parsed;
    }
    // If not an array, treat as old string format and wrap in array
    return [reasoning];
  } catch {
    // If JSON parsing fails, treat as old string format and wrap in array
    return [reasoning];
  }
}

// Import type conversion utilities
import {
  clientToDbString,
  clientToDbArray,
  dbToClientString,
  dbToClientArray,
  clientToDbEnum,
  dbToClientEnum,
  createDescriptionFromJobData,
} from "./analysisStorageConverters";

// Re-export converter functions for backward compatibility
export {
  clientToDbString,
  clientToDbArray,
  dbToClientString,
  dbToClientArray,
  clientToDbEnum,
  dbToClientEnum,
  createDescriptionFromJobData,
};

// Convert between client and database record formats
export function clientRecordToDbRecord(record: AnalysisRecord): Omit<DbAnalysisRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  console.log("Converting client record to DB record");
  console.log("Client record job.title:", record.job.title);
  console.log("Client record job:", JSON.stringify(record.job, null, 2));
  return {
    title: record.job.title,
    company: record.job.company,
    description: createDescriptionFromJobData(record.job), // Keep for backward compatibility
    publishedAt: clientToDbString(record.job.publishedAt),
    location: clientToDbString(record.job.location),
    workload: clientToDbString(record.job.workload),
    duration: clientToDbString(record.job.duration),
    size: clientToDbString(record.job.size),
    companySize: clientToDbString(record.job.companySize),
    stack: record.job.stack,
    // Use structured job content fields
    qualifications: clientToDbArray(record.job.qualifications),
    roles: clientToDbArray(record.job.roles),
    benefits: clientToDbArray(record.job.benefits),
    matchScore: record.llmAnalysis.matchScore,
    reasoning: JSON.stringify(record.llmAnalysis.reasoning), // Convert array to JSON string
    status: clientToDbEnum(record.userInteractions.status),
    isNewThisRun: record.userInteractions.isNewThisRun || false,
    sourceUrl: clientToDbString(record.job.sourceUrl),
    sourceType: null, // Client schema doesn't have sourceType field, database field is optional
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
        description: dbToClientString(record.description), // Keep for backward compatibility
        publishedAt: dbToClientString(record.publishedAt),
        location: dbToClientString(record.location),
        workload: dbToClientString(record.workload),
        duration: dbToClientString(record.duration),
        size: dbToClientString(record.size),
        companySize: dbToClientString(record.companySize),
        stack: record.stack,
        // Use structured fields from database
        qualifications: dbToClientArray(record.qualifications),
        roles: dbToClientArray(record.roles),
        benefits: dbToClientArray(record.benefits),
        sourceUrl: dbToClientString(record.sourceUrl),
        sourceType: dbToClientString(record.sourceType),
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

    return clientRecord as AnalysisRecord;
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
    console.info(`[shouldSkipJobUrl] checking URL: ${url}`);
    console.info(`[shouldSkipJobUrl] hostname: ${urlObj.hostname}, pathname: ${urlObj.pathname}`);

    // Skip non-jobs.ch URLs (for now, we only process jobs.ch)
    if (!urlObj.hostname.includes('jobs.ch')) {
      console.info(`[shouldSkipJobUrl] skipping non-jobs.ch URL: ${url}`);
      return { skip: true, reason: 'Non-jobs.ch domain' };
    }

    // Skip URLs that don't match the expected job detail pattern
    if (!urlObj.pathname.includes('/vacancies/detail/')) {
      console.info(`[shouldSkipJobUrl] skipping non-detail URL: ${url}`);
      return { skip: true, reason: 'Not a job detail page' };
    }

    // Skip URLs with invalid or missing job IDs
    const jobIdMatch = urlObj.pathname.match(/\/vacancies\/detail\/([^\/]+)/);
    if (!jobIdMatch || !jobIdMatch[1] || jobIdMatch[1].length < 10) {
      console.info(`[shouldSkipJobUrl] skipping invalid job ID URL: ${url}, jobId: ${jobIdMatch?.[1]}`);
      return { skip: true, reason: 'Invalid or missing job ID' };
    }

    console.info(`[shouldSkipJobUrl] accepting URL: ${url}`);
    // Skip duplicate URLs (this check will be done by the caller)
    return { skip: false };
  } catch (error) {
    console.error(`[shouldSkipJobUrl] error parsing URL ${url}:`, error);
    return { skip: true, reason: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}


// Import required functions
import { analysisRecordSchema } from "./schemas";