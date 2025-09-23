import type { RecentAnalysisSummary } from "@/lib/clientStorage";
import { loadAnalysisRecord } from "@/lib/clientStorage/core";
import type { AnalysisRecord } from "@/lib/types";
import Fuse from "fuse.js";

// Load full analysis records for rich content search
export function loadFullAnalysisRecords(analyses: RecentAnalysisSummary[]): AnalysisRecord[] {
  const fullRecords: AnalysisRecord[] = [];
  
  for (const summary of analyses) {
    const fullRecord = loadAnalysisRecord(summary.id);
    if (fullRecord) {
      fullRecords.push(fullRecord);
    }
  }
  
  return fullRecords;
}

// Create searchable data structure that includes both summary and rich content
export interface SearchableAnalysis {
  id: number;
  title: string;
  company: string;
  stack: string[];
  location?: string;
  // Rich content from full record
  benefits: string[];
  qualifications: string[];
  roles: string[];
  motto?: string;
  workload?: string;
  duration?: string;
  teamSize?: string;
}

export function createSearchableData(analyses: RecentAnalysisSummary[]): SearchableAnalysis[] {
  const fullRecords = loadFullAnalysisRecords(analyses);
  
  return analyses.map(summary => {
    const fullRecord = fullRecords.find(record => record.id === summary.id);
    
    return {
      id: summary.id,
      title: summary.title,
      company: summary.company,
      stack: summary.stack || [],
      location: summary.location,
      // Rich content from full record
      benefits: fullRecord?.job.benefits || [],
      qualifications: fullRecord?.job.qualifications || [],
      roles: fullRecord?.job.roles || [],
      motto: fullRecord?.job.motto,
      workload: summary.workload,
      duration: summary.duration,
      teamSize: summary.teamSize,
    };
  });
}

export function createFuzzySearch(analyses: RecentAnalysisSummary[]): Fuse<SearchableAnalysis> {
  const searchableData = createSearchableData(analyses);
  
  return new Fuse(searchableData, {
    keys: [
      { name: 'title', weight: 0.25 },
      { name: 'company', weight: 0.2 },
      { name: 'stack', weight: 0.15 },
      { name: 'location', weight: 0.1 },
      { name: 'benefits', weight: 0.1 },
      { name: 'qualifications', weight: 0.1 },
      { name: 'roles', weight: 0.05 },
      { name: 'motto', weight: 0.05 }
    ],
    threshold: 0.4, // Lower threshold = more strict matching
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
  });
}
