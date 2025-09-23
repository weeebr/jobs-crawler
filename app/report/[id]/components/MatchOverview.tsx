import type { AnalysisHeader } from "../hooks/useAnalysisRecord";
import type { AnalysisRecord } from "@/lib/types";
import { sortTechStackByColor } from "@/lib/badgeUtils";
import { formatPostedDate } from "@/lib/dateUtils";
import { CompanyDisplay } from "./CompanyDisplay";
import { CompanyValues } from "./CompanyValues";
import { TechBadge } from "@/app/components/TechBadge";

interface MatchOverviewProps {
  header: AnalysisHeader;
  record: AnalysisRecord;
  onOpenLetterModal?: () => void;
}

export function MatchOverview({ header, record, onOpenLetterModal }: MatchOverviewProps) {
  const jobUrl = record.job.jobUrl || record.job.sourceUrl;
  const companyUrl = header.companyUrl;
  const locationUrl = header.location 
    ? `https://www.google.ch/maps/dir/${encodeURIComponent(header.location)}/Alte+Affolternstrasse+18,+8908+Hedingen/data=!4m2!4m1!3e3`
    : null;


  return (
    <section className="bg-gradient-to-br from-white to-gray-50 border-b border-gray-200">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Job Header Section - Mobile Optimized */}
          <div className="space-y-3">
            {/* Job Title - Full width on mobile */}
            <div className="space-y-2">
              {jobUrl ? (
                <a 
                  href={jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200 leading-tight block line-clamp-3"
                  title="View job posting"
                >
                  {header.title}
                </a>
              ) : (
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight line-clamp-3">
                  {header.title}
                </h1>
              )}
            </div>

            {/* Metadata Row - Compact on mobile */}
            <div className="space-y-2 sm:space-y-1">
              {/* Posted Date */}
              {header.publishedAt && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{formatPostedDate(header.publishedAt)}</span>
                </div>
              )}
              
              {/* Company and Location - Stack on mobile */}
              <div className="space-y-1 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                <div className="flex items-center gap-2">
                  <CompanyDisplay company={header.company} companyUrl={companyUrl} />
                </div>
                
                {header.location && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {locationUrl ? (
                      <a 
                        href={locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
                        title="Get directions"
                      >
                        {header.location}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-600">
                        {header.location}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Motivation Letter Button - Full width on mobile */}
            {onOpenLetterModal && (
              <div className="pt-2">
                <button
                  onClick={onOpenLetterModal}
                  className="w-full sm:w-auto btn-primary px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 min-h-[44px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Motivation Letter
                </button>
              </div>
            )}
          </div>

          {/* Tech Stack Section - Mobile Optimized */}
          {Array.isArray(record.job.stack) && record.job.stack.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Technology Stack
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {sortTechStackByColor(record.job.stack).map((tech: string) => (
                  <TechBadge
                    key={`${record.id}-tech-${tech}`}
                    tech={tech}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Company Values/Motto - Mobile Optimized */}
          {record.job.motto && (
            <CompanyValues motto={record.job.motto} mottoOrigin={record.job.mottoOrigin} />
          )}
        </div>
      </div>
    </section>
  );
}
