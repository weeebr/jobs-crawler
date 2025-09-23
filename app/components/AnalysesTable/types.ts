import type { AnalysisStatus, RecentAnalysisSummary } from "@/lib/clientStorage";

export interface AnalysesTableProps {
  analyses: RecentAnalysisSummary[];
  statuses: Record<number, AnalysisStatus>;
}

export interface DynamicOptions {
  sizes: string[];
  locations: Array<{ value: string; label: string }>;
  tech: Array<{ value: string; label: string }>;
}

export const SCORE_FILTERS = [
  { label: "All scores", value: "all" },
  { label: "90+", value: "90" },
  { label: "80+", value: "80" },
  { label: "70+", value: "70" },
  { label: "60+", value: "60" },
];

export const STATUS_FILTERS: Array<{ label: string; value: "all" | AnalysisStatus }> = [
  { label: "All statuses", value: "all" },
  { label: "Interested", value: "interested" },
  { label: "Applied", value: "applied" },
];

export const SORT_OPTIONS: Array<{ label: string; value: "newest" | "oldest" | "score-high" | "score-low" }> = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Score ↓", value: "score-high" },
  { label: "Score ↑", value: "score-low" },
];
