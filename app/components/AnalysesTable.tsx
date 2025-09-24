"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisStatus, FilterState, RecentAnalysisSummary } from "@/lib/schemas/clientStorageSchemas";
import type { AnalysisRecord } from "@/lib/types";
import { loadFilterState, persistFilterState, DEFAULT_FILTER_STATE } from "@/lib/clientStorage/filterState";

import { AnalysisCard } from "./AnalysesTable/AnalysisCard";
import { AnalysesTableHeader } from "./AnalysesTable/AnalysesTableHeader";
import { EmptyState } from "./AnalysesTable/EmptyState";
import { FilterControls } from "./AnalysesTable/FilterControls";
import type { AnalysesTableProps } from "./AnalysesTable/types";
import { deriveDynamicOptions, filterAndSortAnalyses } from "./AnalysesTable/filterUtils";
import { loadSeenAnalysisIds, persistSeenAnalysisIds } from "@/lib/clientStorage/seenAnalyses";
import { transformToRecentAnalysisSummary } from "./AnalysesTable/analysisTransforms";
import { logTransformationResults, logFilteringResults, logFilterState } from "./AnalysesTable/debugUtils";
import { useFilterCallbacks, useAnalysisCallbacks } from "./AnalysesTable/filterCallbacks";

export function AnalysesTable({
  analyses,
  statuses,
  onStatusToggle,
  onDelete,
}: AnalysesTableProps) {
  const [filters, setFilters] = useState<FilterState>(() => loadFilterState());
  const [showFilters, setShowFilters] = useState(false);
  const seenIdsRef = useRef<Set<number>>(loadSeenAnalysisIds());
  const [freshIds, setFreshIds] = useState<Set<number>>(new Set<number>());

  const { updateFilter, resetFilters: resetFiltersCallback } = useFilterCallbacks(setFilters);
  const { handleStatusToggle, handleDelete } = useAnalysisCallbacks(onStatusToggle, onDelete);

  const transformedAnalyses = useMemo(
    () => transformToRecentAnalysisSummary(analyses),
    [analyses],
  );

  // Log transformation results for debugging
  useEffect(() => {
    logTransformationResults(analyses.length, transformedAnalyses.length);
  }, [analyses.length, transformedAnalyses.length]);

  const dynamicOptions = useMemo(
    () => deriveDynamicOptions(transformedAnalyses),
    [transformedAnalyses],
  );

  const filteredAnalyses = useMemo(
    () => filterAndSortAnalyses(transformedAnalyses, filters, statuses),
    [transformedAnalyses, filters, statuses],
  );

  // Debug logging for troubleshooting
  useEffect(() => {
    logFilteringResults(analyses.length, transformedAnalyses.length, filteredAnalyses.length, filters, statuses);
  }, [analyses.length, transformedAnalyses.length, filteredAnalyses.length, filters, statuses]);

  // Track which analyses are new this run
  const newThisRunIds = new Set(analyses.filter(analysis => analysis.userInteractions.isNewThisRun).map(analysis => analysis.id));


  const handleStatusToggleWithFresh = useCallback(async (analysisId: number, status: 'interested' | 'applied'): Promise<boolean> => {
    // Clear new status for this analysis
    setFreshIds(prev => {
      const next = new Set(prev);
      next.delete(analysisId);
      return next;
    });

    try {
      const result = await handleStatusToggle(analysisId, status);
      return result;
    } catch (error) {
      console.error('Failed to toggle status:', error);
      return false;
    }
  }, [handleStatusToggle]);

  const handleDeleteWithError = useCallback(async (analysisId: number): Promise<boolean> => {
    try {
      const result = await handleDelete(analysisId);
      return result;
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      return false;
    }
  }, [handleDelete]);

  const updateFilterCallback = updateFilter;

  const resetFilters = resetFiltersCallback;

  // Debug logging for filter state
  useEffect(() => {
    logFilterState(filteredAnalyses.length, analyses.length, filters, statuses);
  }, [filteredAnalyses.length, analyses.length, filters, statuses]);

  // Track seen analyses
  useEffect(() => {
    if (analyses.length === 0) {
      return;
    }

    const currentSeen = seenIdsRef.current;
    const newIds = analyses
      .map((analysis) => analysis.id)
      .filter((id) => !currentSeen.has(id));

    if (newIds.length === 0) {
      return;
    }

    setFreshIds((prev) => {
      const next = new Set(prev);
      newIds.forEach((id) => next.add(id));
      return next;
    });

    const updatedSeen = new Set(currentSeen);
    newIds.forEach((id) => updatedSeen.add(id));
    seenIdsRef.current = updatedSeen;
    persistSeenAnalysisIds(updatedSeen);
  }, [analyses]);

  if (analyses.length === 0) {
    return <EmptyState type="no-analyses" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden main-container">
      {/* Header */}
      <AnalysesTableHeader
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        resetFilters={resetFilters}
        filteredAnalysesCount={filteredAnalyses.length}
        totalAnalysesCount={analyses.length}
      />

      <p className="text-sm sm:text-base text-neutral-600 -mt-1 sm:-mt-2">Track your career opportunities and match scores</p>

      {/* Filters */}
      <FilterControls
        filters={filters}
        dynamicOptions={dynamicOptions}
        onFilterChange={updateFilterCallback}
        isVisible={showFilters}
      />

      {/* Analysis Cards */}
      {filteredAnalyses.length === 0 ? (
        <EmptyState
          type="no-matches"
          onResetFilters={() => resetFilters()}
        />
      ) : (
        <div className="space-y-4">
          {filteredAnalyses.map((filteredAnalysis) => {
            // Find the original analysis record to pass to AnalysisCard
            const originalAnalysis = analyses.find(a => a.id === filteredAnalysis.id)!;
            const status = (statuses?.[filteredAnalysis.id]) ?? filteredAnalysis.status;
            return (
              <AnalysisCard
                key={filteredAnalysis.id}
                analysis={originalAnalysis}
                isNew={newThisRunIds.has(filteredAnalysis.id)}
                onStatusToggle={handleStatusToggleWithFresh}
                onDelete={handleDeleteWithError}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
