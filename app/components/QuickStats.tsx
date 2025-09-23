"use client";

import { roundMatchScore } from "@/lib/matchScore";
import type { AnalysisStatus, RecentAnalysisSummary } from "@/lib/clientStorage";

interface QuickStatsProps {
  recent: RecentAnalysisSummary[];
  statuses: Record<number, AnalysisStatus>;
}

export function QuickStats({ recent, statuses }: QuickStatsProps) {
  const interestedCount = Object.values(statuses).filter(s => s === 'interested').length;
  const appliedCount = Object.values(statuses).filter(s => s === 'applied').length;
  const avgMatchScore = recent.length > 0 
    ? recent.reduce((sum, item) => sum + item.matchScore, 0) / recent.length
    : 0;

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Analyses</span>
          <span className="font-semibold text-gray-900">{recent.length}</span>
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
        {recent.length > 0 && (
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
