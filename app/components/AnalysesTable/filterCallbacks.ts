import { useCallback } from "react";
import type { FilterState } from "@/lib/schemas/clientStorageSchemas";
import { persistFilterState, DEFAULT_FILTER_STATE } from "@/lib/clientStorage/filterState";

/**
 * Filter-related callback utilities for AnalysesTable component
 */

export function useFilterCallbacks(setFilters: React.Dispatch<React.SetStateAction<FilterState>>) {
  const updateFilter = useCallback((key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    setFilters((current: FilterState) => {
      if (current[key] === value) {
        return current;
      }
      const newFilters = { ...current, [key]: value };
      persistFilterState(newFilters);
      return newFilters;
    });
  }, [setFilters]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER_STATE);
    persistFilterState(DEFAULT_FILTER_STATE);
  }, [setFilters]);

  return { updateFilter, resetFilters };
}

export function useAnalysisCallbacks(
  onStatusToggle: (analysisId: number, status: 'interested' | 'applied') => Promise<boolean>,
  onDelete: (analysisId: number) => Promise<boolean>
) {
  const handleStatusToggle = useCallback(async (analysisId: number, status: 'interested' | 'applied'): Promise<boolean> => {
    const result = await onStatusToggle(analysisId, status);
    return result;
  }, [onStatusToggle]);

  const handleDelete = useCallback(async (analysisId: number): Promise<boolean> => {
    const result = await onDelete(analysisId);
    return result;
  }, [onDelete]);

  return { handleStatusToggle, handleDelete };
}
