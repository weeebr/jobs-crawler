import type { AnalysisRecord } from "@/lib/types";
import type { AnalysisStatus } from "@/lib/schemas/clientStorageSchemas";

export interface AnalysesTableProps {
  analyses: AnalysisRecord[];
  statuses: Record<number, AnalysisStatus>;
  onStatusToggle: (id: number, status: 'interested' | 'applied') => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
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

export const STATUS_FILTERS: Array<{ label: string; value: "all" | "interested" | "applied" }> = [
  { label: "All statuses", value: "all" },
  { label: "Interested", value: "interested" },
  { label: "Applied", value: "applied" },
];

export const SORT_OPTIONS: Array<{ label: string; value: "posting-newest" | "posting-oldest" | "score-high" | "score-low" }> = [
  { label: "Posting Date ↓", value: "posting-newest" },
  { label: "Posting Date ↑", value: "posting-oldest" },
  { label: "Score ↓", value: "score-high" },
  { label: "Score ↑", value: "score-low" },
];
