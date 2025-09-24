import type { FilterState } from "@/lib/schemas/clientStorageSchemas";
import type { RecentAnalysisSummary } from "@/lib/schemas/clientStorageSchemas";

/**
 * Debug logging utilities for AnalysesTable component
 */

export function logTransformationResults(analysesLength: number, transformedLength: number): void {
  if (analysesLength > 0) {
    console.info(`[analyses-table] transformed ${analysesLength} analyses to ${transformedLength} summary objects`);
  }
}

export function logFilteringResults(
  analysesLength: number,
  transformedLength: number,
  filteredLength: number,
  filters: FilterState,
  statuses?: Record<number, string>
): void {
  if (analysesLength > 0) {
    console.info(`[analyses-table-debug] analyses: ${analysesLength}, transformed: ${transformedLength}, filtered: ${filteredLength}, filters:`, filters);
    if (filteredLength !== transformedLength) {
      console.info(`[analyses-table-debug] filtering reduced results from ${transformedLength} to ${filteredLength}`);
    }
  }
}

export function logFilterState(
  filteredLength: number,
  totalLength: number,
  filters: FilterState,
  statuses?: Record<number, string>
): void {
  console.info(
    `[analyses-table] showing ${filteredLength}/${totalLength} analyses after filters`,
    {
      filters,
      statuses: Object.keys(statuses || {}).length,
      hasSearch: filters.search?.trim().length > 0,
      searchTerm: filters.search
    }
  );

  // If we have analyses but no filtered results, log the filter details
  if (totalLength > 0 && filteredLength === 0) {
    console.warn('[analyses-table] No results after filtering:', {
      totalAnalyses: totalLength,
      activeFilters: {
        status: filters.status,
        search: filters.search,
        size: filters.size,
        score: filters.score,
        location: filters.location,
        tech: filters.tech
      }
    });
  }
}
