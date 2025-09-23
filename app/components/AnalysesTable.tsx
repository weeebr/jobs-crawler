"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalysisStatus, FilterState } from "@/lib/clientStorage";
import { loadFilterState, persistFilterState } from "@/lib/clientStorage";

import { AnalysisCard } from "./AnalysesTable/AnalysisCard";
import { EmptyState } from "./AnalysesTable/EmptyState";
import { FilterControls } from "./AnalysesTable/FilterControls";
import type { AnalysesTableProps } from "./AnalysesTable/types";
import { deriveDynamicOptions, filterAndSortAnalyses } from "./AnalysesTable/filterUtils";

export function AnalysesTable({
  analyses,
  statuses,
}: AnalysesTableProps) {
  const [filters, setFilters] = useState<FilterState>(() => loadFilterState());
  const [showFilters, setShowFilters] = useState(false);

  const dynamicOptions = useMemo(
    () => deriveDynamicOptions(analyses),
    [analyses],
  );

  const filteredAnalyses = useMemo(
    () => filterAndSortAnalyses(analyses, filters, statuses),
    [analyses, filters, statuses],
  );

  const updateFilter = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    setFilters((current: FilterState) => {
      if (current[key] === value) {
        return current;
      }
      const newFilters = { ...current, [key]: value };
      persistFilterState(newFilters);
      return newFilters;
    });
  };

  // Check if any filter is active (not set to default "all" values)
  const hasActiveFilters = 
    filters.size !== "all" ||
    filters.score !== "all" ||
    filters.location !== "all" ||
    filters.tech !== "all" ||
    filters.status !== "all" ||
    filters.sort !== "newest";

  useEffect(() => {
    console.info(
      `[analyses-table] showing ${filteredAnalyses.length}/${analyses.length} analyses after filters`,
      filters,
    );
  }, [filteredAnalyses.length, analyses.length, filters]);

  if (analyses.length === 0) {
    return <EmptyState type="no-analyses" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden main-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Your Job Analyses</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors px-2 py-1.5 rounded-md hover:bg-neutral-100 min-h-[36px]"
          >
            <span>Filters</span>
            {hasActiveFilters && (
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            )}
            <svg
              className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="text-sm text-neutral-500">
          {filteredAnalyses.length} of {analyses.length} analyses
        </div>
      </div>
      
      <p className="text-sm sm:text-base text-neutral-600 -mt-1 sm:-mt-2">Track your career opportunities and match scores</p>

      {/* Filters */}
      <FilterControls
        filters={filters}
        dynamicOptions={dynamicOptions}
        onFilterChange={updateFilter}
        isVisible={showFilters}
      />

      {/* Analysis Cards */}
      {filteredAnalyses.length === 0 ? (
        <EmptyState type="no-matches" />
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredAnalyses.map((analysis) => {
            const status = statuses[analysis.id] ?? analysis.status;
            return (
              <AnalysisCard
                key={analysis.id}
                analysis={analysis}
                status={status}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
