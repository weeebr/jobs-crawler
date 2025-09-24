import Link from "next/link";
import type { AnalysisRecord } from "@/lib/types";
import { filterDisplayValue } from "@/lib/jobAd/metadata/filterUtils";
import { sortTechStackByColor } from "@/lib/badgeUtils";
import { roundMatchScore } from "@/lib/matchScore";
import { TechBadge } from "@/app/components/TechBadge";
import { CardHeader } from "@/app/components/AnalysesTable/components/CardHeader";
import { CardMetadata } from "@/app/components/AnalysesTable/components/CardMetadata";
import { CardActions } from "@/app/components/AnalysesTable/components/CardActions";


interface AnalysisCardProps {
  analysis: AnalysisRecord;
  isNew?: boolean;
  onStatusToggle: (id: number, status: 'interested' | 'applied') => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onClearNewStatus?: () => void;
}

export function AnalysisCard({ analysis, isNew = false, onStatusToggle, onDelete, onClearNewStatus }: AnalysisCardProps) {
  const displayScore = roundMatchScore(analysis.llmAnalysis.matchScore);
  const currentStatus = analysis.userInteractions.status;

  const handleStatusToggle = async (newStatus: 'interested' | 'applied') => {
    const success = await onStatusToggle(analysis.id, newStatus);
    if (success) {
      onClearNewStatus?.();
    }
  };

  const handleDelete = async () => {
    try {
      const success = await onDelete(analysis.id);
      if (success) {
        onClearNewStatus?.();
      }
    } catch (error) {
      console.error('Failed to delete analysis:', error);
    }
  };

  const metadataItems = [
    { value: filterDisplayValue(analysis.job.workload) },
    { value: filterDisplayValue(analysis.job.duration) },
    { value: filterDisplayValue(analysis.job.size) },
  ].filter(item => item.value);

  return (
    <div className="card-elevated p-6 group flex flex-col">
      {/* Main content as link */}
      <Link
        href={`/report/${analysis.id}`}
        className="flex-1 min-h-0 space-y-4 pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-500"
        title={`View analysis for ${analysis.job.title} at ${analysis.job.company}`}
      >
        <CardHeader
          title={analysis.job.title}
          company={analysis.job.company}
          publishedAt={analysis.job.publishedAt}
          isNew={isNew}
        />

        <CardMetadata
          matchScore={analysis.llmAnalysis.matchScore}
          publishedAt={analysis.job.publishedAt}
          metadataItems={metadataItems}
        />

        {/* Tech Stack */}
        {Array.isArray(analysis.job.stack) && analysis.job.stack.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-1.5">
              {sortTechStackByColor(analysis.job.stack).map((tech: string) => (
                <TechBadge
                  key={`${analysis.id}-${tech}`}
                  tech={tech}
                />
              ))}
            </div>
          </div>
        )}
      </Link>

      <CardActions
        currentStatus={currentStatus}
        onStatusToggle={handleStatusToggle}
        onDelete={handleDelete}
      />
    </div>
  );
}