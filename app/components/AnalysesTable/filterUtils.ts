import type { RecentAnalysisSummary, FilterState } from "@/lib/schemas/clientStorageSchemas";
import type { AnalysisStatus } from "@/lib/schemas/clientStorageSchemas";
import type { DynamicOptions } from "./types";
import { roundMatchScore } from "@/lib/matchScore";
import { createFuzzySearch } from "./searchUtils";
import { normalizeLocationLabel } from "@/lib/jobAd/metadata/locationUtils";
import { determineCompanySizeOptions, matchesCompanySizeFilter } from "./companySizeUtils";

export function isValidLocationForFilter(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return false;
  
  // Reject technical keys, URLs, and job descriptions
  if (
    trimmed.includes("://") ||
    trimmed.includes("LOCATIONIQ_MAPS_KEY") ||
    trimmed.includes("Starting date") ||
    trimmed.includes("Founded in") ||
    trimmed.includes("your application cannot be considered") ||
    trimmed.includes("Lambda Health System") ||
    trimmed.match(/^[A-Z_]+$/) || // All caps technical keys
    trimmed.length > 50 // Too long for a location
  ) {
    return false;
  }
  
  // Accept city names, countries, and common remote formats with lightweight sanitization
  if (!/[A-Za-z]/.test(trimmed)) {
    return false;
  }

  if (/[{}[\]<>|]/.test(trimmed)) {
    return false;
  }

  const allowedPattern = /^[A-Za-z0-9\s,.'()\/&+\-\u2013\u2014]+$/;
  return allowedPattern.test(trimmed);
}

export function deriveDynamicOptions(analyses: RecentAnalysisSummary[]): DynamicOptions {
  const locationMap = new Map<string, string>();
  const techMap = new Map<string, string>();

  for (const item of analyses) {
    if (item.location) {
      const trimmed = item.location.trim();
      const normalizedLabel = normalizeLocationLabel(trimmed) ?? trimmed;
      if (normalizedLabel.length > 0 && isValidLocationForFilter(normalizedLabel)) {
        const normalizedValue = normalizedLabel.toLowerCase();
        if (!locationMap.has(normalizedValue)) {
          locationMap.set(normalizedValue, normalizedLabel);
        }
      }
    }

    // Defensive check: ensure stack is an array
    const stack = Array.isArray(item.stack) ? item.stack : [];
    for (const tech of stack) {
      if (typeof tech !== "string") continue;
      const trimmed = tech.trim();
      if (trimmed.length === 0) continue;
      const normalized = trimmed.toLowerCase();
      if (!techMap.has(normalized)) {
        techMap.set(normalized, trimmed);
      }
    }
  }

  return {
    sizes: determineCompanySizeOptions(analyses),
    locations: Array.from(locationMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label })),
    tech: Array.from(techMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label })),
  };
}


export function filterAndSortAnalyses(
  analyses: RecentAnalysisSummary[],
  filters: FilterState,
  statuses: Record<number, AnalysisStatus>,
): RecentAnalysisSummary[] {
  const minScore = filters.score === "all" ? 0 : Number.parseInt(filters.score, 10);

  // Apply fuzzy search if search term is provided
  let searchResults = analyses;
  if (filters.search && filters.search.trim().length > 0) {
    const fuse = createFuzzySearch(analyses);
    const searchResults_raw = fuse.search(filters.search.trim());
    const searchResultIds = new Set(searchResults_raw.map(result => result.item.id));
    searchResults = analyses.filter(analysis => searchResultIds.has(analysis.id));
  }

  const filtered = searchResults.filter((item) => {
    const roundedScore = roundMatchScore(item.matchScore);

    if (filters.status !== "all") {
      const currentStatus = (statuses?.[item.id]) ?? item.status;
      if (currentStatus !== filters.status) {
        return false;
      }
    }

    if (filters.size !== "all") {
      if (!matchesCompanySizeFilter(item.size, filters.size)) {
        return false;
      }
    }

    if (roundedScore < minScore) {
      return false;
    }

    if (filters.location !== "all") {
      const normalizedLocation = normalizeLocationLabel(item.location)?.toLowerCase();
      if (!normalizedLocation || normalizedLocation !== filters.location) {
        return false;
      }
    }

    if (filters.tech !== "all") {
      // Defensive check: ensure stack is an array
      const stack = Array.isArray(item.stack) ? item.stack : [];
      const normalizedStack = stack.map((tech: string) => tech.trim().toLowerCase());
      if (!normalizedStack.includes(filters.tech)) {
        return false;
      }
    }

    return true;
  });

  return filtered.sort((a, b) => {
    switch (filters.sort) {
      case "score-high":
        return roundMatchScore(b.matchScore) - roundMatchScore(a.matchScore);
      case "score-low":
        return roundMatchScore(a.matchScore) - roundMatchScore(b.matchScore);
      case "posting-newest":
        // Sort by posting date (newest first), fallback to createdAt if no posting date
        const aPostingDate = a.publishedAt ? new Date(a.publishedAt).getTime() : a.createdAt;
        const bPostingDate = b.publishedAt ? new Date(b.publishedAt).getTime() : b.createdAt;
        return bPostingDate - aPostingDate;
      case "posting-oldest":
        // Sort by posting date (oldest first), fallback to createdAt if no posting date
        const aPostingDateOld = a.publishedAt ? new Date(a.publishedAt).getTime() : a.createdAt;
        const bPostingDateOld = b.publishedAt ? new Date(b.publishedAt).getTime() : b.createdAt;
        return aPostingDateOld - bPostingDateOld;
      default:
        // Default to posting-newest behavior
        const aDefaultDate = a.publishedAt ? new Date(a.publishedAt).getTime() : a.createdAt;
        const bDefaultDate = b.publishedAt ? new Date(b.publishedAt).getTime() : b.createdAt;
        return bDefaultDate - aDefaultDate;
    }
  });
}
