"use client";

import { roundMatchScore } from "@/lib/matchScore";
import type { AnalysisRecord } from "@/lib/types";

interface QuickStatsProps {
  analyses: AnalysisRecord[];
  isLoading?: boolean;
}

export function QuickStats({ analyses, isLoading }: QuickStatsProps) {
  if (isLoading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Defensive check: ensure analyses is an array
  const analysesArray = Array.isArray(analyses) ? analyses : [];

  const interestedCount = analysesArray.filter(a => a.userInteractions.status === 'interested').length;
  const appliedCount = analysesArray.filter(a => a.userInteractions.status === 'applied').length;
  const avgMatchScore = analysesArray.length > 0
    ? analysesArray.reduce((sum, item) => sum + item.llmAnalysis.matchScore, 0) / analysesArray.length
    : 0;

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Analyses</span>
          <span className="font-semibold text-gray-900">{analysesArray.length}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Interested</span>
          <span className="font-semibold text-green-600">
            {interestedCount}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Applied</span>
          <span className="font-semibold text-blue-600">
            {appliedCount}
          </span>
        </div>
        {analysesArray.length > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Avg. Match Score</span>
            <span className="font-semibold text-gray-900">
              {roundMatchScore(avgMatchScore)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
