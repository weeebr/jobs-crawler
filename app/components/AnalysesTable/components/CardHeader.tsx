import type { AnalysisRecord } from "@/lib/types";
import { roundMatchScore } from "@/lib/matchScore";

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

interface CardHeaderProps {
  title: string;
  company: string;
  publishedAt?: string;
  isNew?: boolean;
}

export function CardHeader({ title, company, publishedAt, isNew }: CardHeaderProps) {
  return (
    <div className="flex items-start relative">
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-neutral-900 mb-1 line-clamp-1 group-hover:text-accent-600 transition-colors">
            {title}
          </h3>
        </div>
        <p className="text-neutral-600 font-medium">{company}</p>
      </div>

      {/* Fixed position blue dot - positioned to the right */}
      {isNew && (
        <div className="absolute top-0 right-0 flex items-center" aria-hidden="true">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        </div>
      )}
      {isNew && <span className="sr-only">New analysis</span>}
    </div>
  );
}