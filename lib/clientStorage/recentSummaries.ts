import type { AnalysisRecord } from "../types";
import type { RecentAnalysisSummary } from "./types";
import { recentAnalysisSummarySchema } from "../schemas";
import { RECENT_ANALYSES_KEY, isBrowser, getLocalStorage } from "./types";
import { setAnalysisStatus } from "./analysisStatus";

export function loadRecentSummaries(): RecentAnalysisSummary[] {
  if (!isBrowser()) return [];
  const storage = getLocalStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(RECENT_ANALYSES_KEY);
    if (!raw) return [];

    // Check for common corruption issues
    if (raw.trim() === '' || raw.trim() === 'null' || raw.trim() === 'undefined') {
      storage.removeItem(RECENT_ANALYSES_KEY);
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const sanitized: RecentAnalysisSummary[] = [];
    for (let i = 0; i < parsed.length; i++) {
      try {
        const validated = recentAnalysisSummarySchema.parse(parsed[i]);
        sanitized.push(validated);
      } catch (error) {
        continue; // Skip invalid items
      }
    }
    return sanitized;
  } catch (error) {
    return [];
  }
}

export function persistRecentSummaries(summaries: RecentAnalysisSummary[]) {
  if (!isBrowser()) return;
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    const jsonData = JSON.stringify(summaries);
    storage.setItem(RECENT_ANALYSES_KEY, jsonData);

    // Trigger UI update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('localStorageImmediateUpdate', {
        detail: { key: RECENT_ANALYSES_KEY, type: 'recent' }
      }));
    }
  } catch (error) {
    console.warn("[clientStorage] failed to persist recents", error);
  }
}

// Utility function to rebuild recent summaries from individual analysis records
export function rebuildRecentSummaries(): void {
  if (!isBrowser()) return;
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    const summaries: RecentAnalysisSummary[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith('cv-analyzer::report::')) {
        const raw = storage.getItem(key);
        if (raw) {
          try {
            const record = JSON.parse(raw);
            summaries.push(toSummary(record));

            // Also restore status information
            if (record.userInteractions?.status) {
              setAnalysisStatus(record.id, record.userInteractions.status);
            }
          } catch (e) {
            // Skip invalid records
          }
        }
      }
    }

    summaries.sort((a, b) => b.createdAt - a.createdAt);
    persistRecentSummaries(summaries);
  } catch (error) {
    console.error("[clientStorage] failed to rebuild recent summaries", error);
  }
}

// Helper function to normalize job size to expected enum values
function normalizeJobSize(size?: string): "5" | "10" | "20" | "50" | "100" | "200" | "500" | undefined {
  if (!size) return undefined;

  // Map common size indicators to expected enum values
  const sizeMap: Record<string, "5" | "10" | "20" | "50" | "100" | "200" | "500"> = {
    'S': '50',      // Small -> 50 employees
    'M': '200',     // Medium -> 200 employees
    'L': '500',     // Large -> 500 employees
    's': '50',
    'm': '200',
    'l': '500',
    'small': '50',
    'medium': '200',
    'large': '500',
    '1-10': '10',
    '11-50': '50',
    '51-200': '200',
    '201-500': '500',
    '501+': '500',
  };

  // If it's already a valid enum value, keep it
  if (['5', '10', '20', '50', '100', '200', '500'].includes(size)) {
    return size as "5" | "10" | "20" | "50" | "100" | "200" | "500";
  }

  // Try to map it
  const normalized = sizeMap[size.toLowerCase()] || sizeMap[size];
  if (normalized) {
    console.info(`[toSummary] normalized job size '${size}' to '${normalized}'`);
    return normalized;
  }

  // If no mapping found, return undefined to make it optional
  console.warn(`[toSummary] could not normalize job size '${size}', setting to undefined`);
  return undefined;
}

export function toSummary(record: AnalysisRecord): RecentAnalysisSummary {
  return {
    id: record.id,
    title: record.job.title,
    company: record.job.company,
    publishedAt: record.job.publishedAt,
    location: record.job.location,
    workload: record.job.workload,
    duration: record.job.duration,
    size: normalizeJobSize(record.job.size),
    companySize: record.job.companySize,
    stack: record.job.stack,
    matchScore: record.llmAnalysis.matchScore,
    status: record.userInteractions.status,
    isNewThisRun: false,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
