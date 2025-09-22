import type { AnalysisRecord } from "../types";
import type { RecentAnalysisSummary } from "./types";
import { RECENT_ANALYSES_KEY, isBrowser } from "./types";

export function loadRecentSummaries(): RecentAnalysisSummary[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(RECENT_ANALYSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<RecentAnalysisSummary>>;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const sanitized: RecentAnalysisSummary[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      if (
        typeof item.id !== "number" ||
        typeof item.title !== "string" ||
        typeof item.company !== "string" ||
        typeof item.matchScore !== "number" ||
        typeof item.createdAt !== "number" ||
        (item.updatedAt !== undefined && typeof item.updatedAt !== "number")
      ) {
        continue;
      }

      const stack = Array.isArray(item.stack)
        ? item.stack.filter((entry): entry is string => typeof entry === "string")
        : [];

      sanitized.push({
        id: item.id,
        title: item.title,
        company: item.company,
        matchScore: item.matchScore,
        createdAt: item.createdAt,
        updatedAt: typeof item.updatedAt === "number" ? item.updatedAt : item.createdAt,
        publishedAt:
          typeof item.publishedAt === "string" ? item.publishedAt : undefined,
        location: typeof item.location === "string" ? item.location : undefined,
        workload: typeof item.workload === "string" ? item.workload : undefined,
        duration: typeof item.duration === "string" ? item.duration : undefined,
        size: typeof item.size === "string" ? item.size : undefined,
        stack,
        status: (item.status === "interested" || item.status === "applied") 
          ? item.status 
          : undefined,
      });
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
