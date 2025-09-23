interface EmptyStateProps {
  type: "no-analyses" | "no-matches";
  onAction?: () => void;
  onResetFilters?: () => void;
}

export function EmptyState({ type, onAction, onResetFilters }: EmptyStateProps) {
  if (type === "no-analyses") {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Analyses Yet</h3>
        <p className="text-neutral-600 mb-6">
          Run your first analysis to see your job matches here.
        </p>
        {onAction && (
          <button className="btn-primary" onClick={onAction}>
            Start Your First Analysis
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">No matches found</h3>
      <p className="text-neutral-600 mb-4">
        Try adjusting your filters to see more results.
      </p>
      {onResetFilters && (
        <button 
          onClick={onResetFilters}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 rounded border border-blue-200 hover:bg-blue-50"
        >
          Reset all filters
        </button>
      )}
    </div>
  );
}
