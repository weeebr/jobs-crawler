import type { FilterState } from "@/lib/schemas/clientStorageSchemas";

interface AnalysesTableHeaderProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  filters: FilterState;
  resetFilters: () => void;
  filteredAnalysesCount: number;
  totalAnalysesCount: number;
}

export function AnalysesTableHeader({
  showFilters,
  setShowFilters,
  filters,
  resetFilters,
  filteredAnalysesCount,
  totalAnalysesCount,
}: AnalysesTableHeaderProps) {
  // Check if any filter is active (not set to default "all" values)
  const hasActiveFilters =
    filters.size !== "all" ||
    filters.score !== "all" ||
    filters.location !== "all" ||
    filters.tech !== "all" ||
    filters.status !== "all" ||
    filters.sort !== "posting-newest";
  return (
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
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
          >
            Reset filters
          </button>
        )}
      </div>
      <div className="text-sm text-neutral-500">
        {filteredAnalysesCount} of {totalAnalysesCount} analyses
      </div>
    </div>
  );
}
