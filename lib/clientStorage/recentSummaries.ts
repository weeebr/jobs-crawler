import type { AnalysisRecord } from "../types";
import type { RecentAnalysisSummary } from "./types";
import { recentAnalysisSummarySchema } from "../schemas";
import { RECENT_ANALYSES_KEY, isBrowser } from "./types";

export function loadRecentSummaries(): RecentAnalysisSummary[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(RECENT_ANALYSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    
    const sanitized: RecentAnalysisSummary[] = [];
    for (const item of parsed) {
      try {
        // Validate each item with Zod schema
        const validated = recentAnalysisSummarySchema.parse(item);
        sanitized.push(validated);
      } catch (error) {
        // Skip invalid items
        console.warn("[clientStorage] invalid recent summary item:", error);
        continue;
      }
    }
    return sanitized;
  } catch (error) {
    console.warn("[clientStorage] failed to load recents", error);
    return [];
  }
}

export function persistRecentSummaries(summaries: RecentAnalysisSummary[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      RECENT_ANALYSES_KEY,
      JSON.stringify(summaries),
    );
  } catch (error) {
    console.warn("[clientStorage] failed to persist recents", error);
  }
}

export function toSummary(record: AnalysisRecord): RecentAnalysisSummary {
  return {
    id: record.id,
    // Fetched data (from job)
    title: record.job.title,
    company: record.job.company,
    publishedAt: record.job.publishedAt,
    location: record.job.location,
    workload: record.job.workload,
    duration: record.job.duration,
    size: record.job.size,
    stack: record.job.stack,
    // Enriched data (from LLM analysis + user interactions)
    matchScore: record.llmAnalysis.matchScore,
    status: record.userInteractions.status,
    // Metadata
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
