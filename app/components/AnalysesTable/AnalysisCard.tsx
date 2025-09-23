import Link from "next/link";
import type { RecentAnalysisSummary, AnalysisStatus } from "@/lib/clientStorage";
import { roundMatchScore } from "@/lib/matchScore";
import { filterDisplayValue } from "@/lib/jobAd/metadata/filterUtils";
import { sortTechStackByColor } from "@/lib/badgeUtils";
import { TechBadge } from "@/app/components/TechBadge";


interface AnalysisCardProps {
  analysis: RecentAnalysisSummary;
  status: AnalysisStatus;
  isNew?: boolean;
  onStatusToggle: (id: number, status: AnalysisStatus) => void;
  onDelete: (id: number) => Promise<void>;
}

function formatRelativeDate(dateString: string): string {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }

  const now = new Date();
  const diffInMs = now.getTime() - parsed.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "today";
  } else if (diffInDays === 1) {
    return "yesterday";
  } else {
    return `${diffInDays} days ago`;
  }
}

function getMatchScoreClass(score: number): string {
  if (score >= 80) return 'match-score-excellent';
  if (score >= 60) return 'match-score-good';
  if (score >= 40) return 'match-score-fair';
  return 'match-score-poor';
}

function createButtonClickHandler(
  handler: () => void | Promise<void>
): (e: React.MouseEvent) => void {
  return (e) => {
    e.preventDefault();
    e.stopPropagation();
    handler();
  };
}

function MetadataItems({ items }: { items: Array<{ value: string | undefined }> }) {
  if (items.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-600">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AnalysisCard({ analysis, status, isNew = false, onStatusToggle, onDelete }: AnalysisCardProps) {
  const displayScore = roundMatchScore(analysis.matchScore);

  const handleStatusToggle = (newStatus: AnalysisStatus) => {
    onStatusToggle(analysis.id, newStatus);
  };

  const handleDelete = async () => {
    console.log('Delete button clicked for analysis:', analysis.id);
    try {
      await onDelete(analysis.id);
      console.log('Delete completed successfully');
    } catch (error) {
      console.error('Failed to delete analysis:', error);
    }
  };

  const metadataItems = [
    { value: filterDisplayValue(analysis.workload) },
    { value: filterDisplayValue(analysis.duration) },
    { value: filterDisplayValue(analysis.size) },
  ].filter(item => item.value);

  return (
    <div className="card-elevated p-6 group flex flex-col">
      {/* Main content as link */}
      <Link
        href={`/report/${analysis.id}`}
        className="flex-1 min-h-0 space-y-4 pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-500"
        title={`View analysis for ${analysis.title} at ${analysis.company}`}
      >
        {/* Header with Job Title and Company */}
        <div className="flex items-start relative">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-neutral-900 mb-1 line-clamp-1 group-hover:text-accent-600 transition-colors">
                {analysis.title}
              </h3>
            </div>
            <p className="text-neutral-600 font-medium">{analysis.company}</p>
          </div>
          {/* Fixed position blue dot - positioned to the right */}
          {isNew && (
            <div className="absolute top-0 right-0 flex items-center" aria-hidden="true">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            </div>
          )}
          {isNew && <span className="sr-only">New analysis</span>}
        </div>

        {/* Meta Score and Posted Date - separate row */}
        <div className="flex items-center gap-3">
          {/* Match Score */}
          <div className={`badge ${getMatchScoreClass(displayScore)}`}>
            {displayScore}%
          </div>
          
          {/* Posted Date */}
          {analysis.publishedAt && (
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{formatRelativeDate(analysis.publishedAt)}</span>
            </div>
          )}
        </div>

        {/* Metadata Row */}
        <MetadataItems items={metadataItems} />

        {/* Tech Stack */}
        {Array.isArray(analysis.stack) && analysis.stack.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-1.5">
              {sortTechStackByColor(analysis.stack).map((tech: string) => (
                <TechBadge
                  key={`${analysis.id}-${tech}`}
                  tech={tech}
                />
              ))}
            </div>
          </div>
        )}
      </Link>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 mt-4">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={createButtonClickHandler(() => handleStatusToggle("interested"))}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              status === "interested" 
                ? "border-accent-500 bg-accent-50 text-accent-700" 
                : "border-neutral-300 text-neutral-600 hover:border-accent-400 hover:text-accent-600"
            }`}
          >
            Interested
          </button>
          <button
            type="button"
            onClick={createButtonClickHandler(() => handleStatusToggle("applied"))}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              status === "applied" 
                ? "border-primary-500 bg-primary-50 text-primary-700" 
                : "border-neutral-300 text-neutral-600 hover:border-primary-400 hover:text-primary-600"
            }`}
          >
            Applied
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={createButtonClickHandler(handleDelete)}
            className="text-xs text-error-600 hover:text-error-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
