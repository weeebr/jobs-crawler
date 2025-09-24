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
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-blue-100 text-blue-800';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

interface CardMetadataProps {
  matchScore: number;
  publishedAt?: string;
  metadataItems: Array<{ value: string | undefined }>;
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

export function CardMetadata({ matchScore, publishedAt, metadataItems }: CardMetadataProps) {
  const displayScore = roundMatchScore(matchScore);

  return (
    <div className="space-y-4">
      {/* Meta Score and Posted Date - separate row */}
      <div className="flex items-center gap-3">
        {/* Match Score */}
        <div className={`badge px-2 py-1 text-xs font-semibold rounded-full ${getMatchScoreClass(displayScore)}`}>
          {displayScore}%
        </div>

        {/* Posted Date */}
        {publishedAt && (
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formatRelativeDate(publishedAt)}</span>
          </div>
        )}
      </div>

      {/* Metadata Row */}
      <MetadataItems items={metadataItems} />
    </div>
  );
}