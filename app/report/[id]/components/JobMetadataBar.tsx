import type { ReactNode } from "react";

import type { AnalysisHeader } from "../hooks/useAnalysisRecord";
import type { AnalysisRecord } from "@/lib/types";
import { roundMatchScore } from "@/lib/matchScore";
import { formatCompanySizeForDisplay } from "@/lib/jobAd/metadata/filterUtils";

interface JobMetadataBarProps {
  header: AnalysisHeader | null;
  record: AnalysisRecord;
}

export function JobMetadataBar({ header, record }: JobMetadataBarProps) {
  const matchScore = roundMatchScore(record.llmAnalysis.matchScore);

  // Early return if header is null to prevent runtime errors
  if (!header) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-5xl px-4 py-3">
        {/* Mobile: 2 columns, centered */}
        <div className="flex flex-wrap gap-2 sm:hidden justify-center">
          <MatchScoreCard score={matchScore} record={record} />
          
          {header.workload && (
            <MetadataCard
              icon={
                <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              title="Workload"
              value={header.workload}
            />
          )}
          
          {header.duration && (
            <MetadataCard
              icon={
                <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              title="Duration"
              value={header.duration}
            />
          )}
          
          {header.companySize && (
            <MetadataCard
              icon={
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
              title="Company size"
              value={formatCompanySizeForDisplay(header.companySize)}
            />
          )}
        </div>
        
        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:flex flex-wrap justify-center gap-2">
          <MatchScoreCard score={matchScore} record={record} />
          
          {header.workload && (
            <MetadataCard
              icon={
                <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              title="Workload"
              value={header.workload}
            />
          )}
          
          {header.duration && (
            <MetadataCard
              icon={
                <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              title="Duration"
              value={header.duration}
            />
          )}
          
          {header.companySize && (
            <MetadataCard
              icon={
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
              title="Company size"
              value={formatCompanySizeForDisplay(header.companySize)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface MetadataCardProps {
  icon: ReactNode;
  title: string;
  value: string | ReactNode;
}

function MetadataCard({ icon, title, value }: MetadataCardProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md flex-basis-[calc(50%-4px)] flex-grow-0 flex-shrink-0">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-600">{value}</div>
      </div>
    </div>
  );
}

interface MatchScoreCardProps {
  score: number;
  record: AnalysisRecord;
}

function MatchScoreCard({ score, record }: MatchScoreCardProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md flex-basis-[calc(50%-4px)] flex-grow-0 flex-shrink-0">
      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="relative group min-w-0 flex-1">
        <div>
          <div className="text-xs font-medium text-gray-900">Match Score</div>
          <div className="text-xs text-gray-600 cursor-pointer hover:opacity-80 transition-opacity">
            {score}%
          </div>
        </div>
        <div className="absolute left-0 top-8 z-20 hidden group-hover:block">
          <div className="bg-black text-white text-xs rounded-md p-3 shadow-xl min-w-80 max-w-none w-max">
            <ul className="space-y-1">
              {record.llmAnalysis.reasoning.map((reason: string, index: number) => (
                <li key={index} className="leading-relaxed whitespace-nowrap">{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
