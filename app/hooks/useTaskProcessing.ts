"use client";

import { useEffect, useRef, useCallback } from "react";
import { toSummary, loadRecentSummaries, persistRecentSummaries, type RecentAnalysisSummary } from "@/lib/clientStorage";
import { isAnalysisComplete } from "@/lib/analysisValidation";
import type { BackgroundTask } from "@/lib/useBackgroundTasks";
import { analysisStorage } from "@/lib/analysisStorageHandler";

interface UseTaskProcessingOptions {
  tasks: BackgroundTask[];
  isResetting: boolean;
  allowedTaskIds: Set<string>;
  onTaskResults: (summaries: RecentAnalysisSummary[]) => void;
}

/**
 * Hook for processing background task results
 * Handles adding completed analyses to the dashboard
 */
export function useTaskProcessing({ 
  tasks, 
  isResetting, 
  allowedTaskIds, 
  onTaskResults 
}: UseTaskProcessingOptions) {
  const seenRecordIdsRef = useRef<Set<number>>(new Set());

  // Auto-add results from background tasks to recent analyses
  // Process individual results as they complete (not waiting for entire task)
  useEffect(() => {
    console.info(`[task-processing] useEffect triggered - isResetting: ${isResetting}, tasks: ${tasks.length}, allowedTaskIds: ${Array.from(allowedTaskIds).join(', ')}`);
    
    // Skip processing if we're in the middle of a reset
    if (isResetting) {
      console.info(`[task-processing] skipping task processing - reset in progress (isResetting: ${isResetting})`);
      return;
    }

    const seen = seenRecordIdsRef.current;
    const freshSummaries: RecentAnalysisSummary[] = [];

    console.info(`[task-processing] processing ${tasks.length} tasks with results:`, 
      tasks.map(t => ({ id: t.id, status: t.status, resultsCount: t.results.length }))
    );

    for (const task of tasks) {
      // Only process tasks that were created after the last reset
      if (allowedTaskIds.size > 0 && !allowedTaskIds.has(task.id)) {
        console.info(`[task-processing] skipping old task ${task.id} - not in allowed list (allowed: ${Array.from(allowedTaskIds).join(', ')})`);
        continue;
      }
      
      // Process results from both running and completed tasks
      // This allows dashboard updates as individual jobs complete
      for (const result of task.results) {
        if (seen.has(result.id)) {
          console.info(`[task-processing] already seen analysis ${result.id}, skipping`);
          continue;
        }
        
        // Only add fully completed analyses with enriched LLM data
        const isComplete = isAnalysisComplete(result);
        console.info(`[task-processing] checking analysis ${result.id} completeness:`, {
          isComplete,
          hasLlmAnalysis: !!result.llmAnalysis,
          matchScore: result.llmAnalysis?.matchScore,
          reasoningLength: result.llmAnalysis?.reasoning?.length,
          analyzedAt: result.llmAnalysis?.analyzedAt,
          hasJob: !!result.job,
          hasCv: !!result.cv
        });
        
        if (isComplete) {
          seen.add(result.id);
          analysisStorage.save(result, "client");
          const summary = toSummary(result);
          freshSummaries.push(summary);
          
          console.info(`[task-processing] ✅ added complete analysis ${result.id} with matchScore ${result.llmAnalysis.matchScore} from task ${task.status}`);
        } else {
          console.warn(`[task-processing] ❌ skipping incomplete analysis ${result.id} - missing LLM data or other required fields`);
        }
      }
    }

    if (freshSummaries.length > 0) {
      // Update recent summaries in localStorage with all new summaries at once
      // This prevents race conditions when multiple analyses complete simultaneously
      const currentRecent = loadRecentSummaries();
      const existingIds = new Set(currentRecent.map(item => item.id));
      const newSummaries = freshSummaries.filter(summary => !existingIds.has(summary.id));
      
      if (newSummaries.length > 0) {
        const updatedRecent = [...newSummaries, ...currentRecent];
        persistRecentSummaries(updatedRecent);
        console.info(`[task-processing] 🎉 updated localStorage with ${newSummaries.length} new analyses, total: ${updatedRecent.length}`);
      }
      
      console.info(`[task-processing] 🎉 ${freshSummaries.length} complete analyses added to dashboard`);
      onTaskResults(freshSummaries);
    } else {
      console.info(`[task-processing] no new complete analyses to add`);
    }
  }, [tasks, isResetting, allowedTaskIds, onTaskResults]);

  const initializeSeenRecords = useCallback((recent: RecentAnalysisSummary[]) => {
    const seen = seenRecordIdsRef.current;
    for (const summary of recent) {
      seen.add(summary.id);
    }
    console.info(`[task-processing] initialized seen records: ${seen.size} items`);
  }, []);

  const clearSeenRecords = useCallback(() => {
    seenRecordIdsRef.current = new Set();
  }, []);

  return {
    initializeSeenRecords,
    clearSeenRecords,
  };
}
