import type { AnalysisRecord } from "@/lib/types";
import type { RecentAnalysisSummary } from "@/lib/schemas/clientStorageSchemas";

/**
 * Transform AnalysisRecord to RecentAnalysisSummary for filtering
 */
export function transformToRecentAnalysisSummary(analyses: AnalysisRecord[]): RecentAnalysisSummary[] {
  return analyses.map(analysis => {
    try {
      return {
        id: analysis.id,
        title: analysis.job.title,
        company: analysis.job.company,
        stack: analysis.job.stack,
        location: analysis.job.location,
        matchScore: analysis.llmAnalysis.matchScore,
        isNewThisRun: analysis.userInteractions.isNewThisRun,
        status: analysis.userInteractions.status,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        publishedAt: analysis.job.publishedAt,
        companySize: analysis.job.size,
      };
    } catch (error) {
      console.error('[transform] failed for analysis:', analysis.id, error);
      // Return a minimal valid object to prevent crashes
      return {
        id: analysis.id,
        title: analysis.job.title || 'Unknown Title',
        company: analysis.job.company || 'Unknown Company',
        stack: analysis.job.stack || [],
        location: analysis.job.location || '',
        matchScore: analysis.llmAnalysis.matchScore || 0,
        isNewThisRun: analysis.userInteractions.isNewThisRun || false,
        status: analysis.userInteractions.status,
        createdAt: analysis.createdAt || Date.now(),
        updatedAt: analysis.updatedAt || Date.now(),
        publishedAt: analysis.job.publishedAt,
        companySize: analysis.job.size,
      };
    }
  });
}
