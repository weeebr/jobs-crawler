"use client";

import { useCallback, useState } from "react";
import type { AnalysisRecord } from "@/lib/types";

import { AnalysisCard } from "./AnalysesTable/AnalysisCard";
import { EmptyState } from "./AnalysesTable/EmptyState";
import type { AnalysesTableProps } from "./AnalysesTable/types";

export function AnalysesTable({
  analyses,
  onStatusToggle,
  onDelete,
}: AnalysesTableProps) {
  const [freshIds, setFreshIds] = useState<Set<number>>(new Set<number>());

  // Track which analyses are new this run
  const newThisRunIds = new Set(analyses.filter(analysis => analysis.userInteractions.isNewThisRun).map(analysis => analysis.id));

  const handleStatusToggle = useCallback(async (analysisId: number, status: 'interested' | 'applied'): Promise<boolean> => {
    // Clear new status for this analysis
    setFreshIds(prev => {
      const next = new Set(prev);
      next.delete(analysisId);
      return next;
    });

    try {
      const result = await onStatusToggle(analysisId, status);
      return result;
    } catch (error) {
      console.error('Failed to toggle status:', error);
      return false;
    }
  }, [onStatusToggle]);

  const handleDelete = useCallback(async (analysisId: number): Promise<boolean> => {
    try {
      const result = await onDelete(analysisId);
      return result;
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      return false;
    }
  }, [onDelete]);

  if (analyses.length === 0) {
    return <EmptyState type="no-analyses" />;
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <AnalysisCard
          key={analysis.id}
          analysis={analysis}
          isNew={newThisRunIds.has(analysis.id)}
          onStatusToggle={handleStatusToggle}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
