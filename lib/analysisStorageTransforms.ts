import type { AnalysisRecord } from "./types";
import { analysisRecordSchema } from "./schemas";
import type { AnalysisRecord as DbAnalysisRecord } from "./db/schema";

// Transform database record to client record
export function dbRecordToClientRecord(dbRecord: DbAnalysisRecord): AnalysisRecord {
  const { stack, ...dbJob } = dbRecord;

  return analysisRecordSchema.parse({
    id: dbRecord.id,
    job: {
      title: dbRecord.title,
      company: dbRecord.company,
      description: dbRecord.description || '',
      publishedAt: dbRecord.publishedAt || null,
      location: dbRecord.location || null,
      workload: dbRecord.workload || null,
      duration: dbRecord.duration || null,
      size: dbRecord.size || null,
      companySize: dbRecord.companySize || null,
      stack: stack as string[],
    },
    llmAnalysis: {
      matchScore: dbRecord.matchScore,
      reasoning: dbRecord.reasoning,
    },
    userInteractions: {
      status: dbRecord.status || null,
      isNewThisRun: dbRecord.isNewThisRun || false,
      interactionCount: 0,
    },
    createdAt: dbRecord.createdAt.getTime(),
    updatedAt: dbRecord.updatedAt.getTime(),
  });
}

// Get current API key
export async function getCurrentApiKey(): Promise<string> {
  const headersList = await import('headers').then(m => m.headers());
  const apiKey = headersList.get('x-api-key') || headersList.get('authorization')?.replace('Bearer ', '');
  return apiKey || process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
}
