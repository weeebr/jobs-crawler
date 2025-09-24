import { analyzeSingleJob } from "@/lib/streaming/jobAnalysis";
import { shouldSkipJobUrl } from "@/lib/analysisStorageUtils";
import { addTaskResult, addTaskError, getTaskAbortController } from "@/lib/backgroundTasks";
import { extractErrorMessage } from "@/lib/apiUtils";
import { getExistingJobUrls } from "@/lib/clientStorage/core";
import type { CVProfile } from "@/lib/schemas";
import type { AnalysisRecord } from "@/lib/types";

export async function processJobLinksInParallel(
  jobLinks: string[],
  cvProfile: CVProfile,
  options: { clearJobAdData?: boolean },
  taskId: string | undefined,
  sendMessage: (type: string, data: unknown) => void,
  isClosed: () => boolean
): Promise<{ records: AnalysisRecord[]; errors: { url: string; message: string }[] }> {
  const records: AnalysisRecord[] = [];
  const errors: { url: string; message: string }[] = [];
  const BATCH_SIZE = 3; // Process 3 jobs concurrently
  
  // Get existing job URLs to check for duplicates
  const existingUrls = getExistingJobUrls();
  console.info(`[parallelProcessor] checking ${jobLinks.length} job links against ${existingUrls.size} existing URLs`);

  // Get the AbortController for this task
  const taskAbortController = taskId ? getTaskAbortController(taskId) : null;
  
  for (let i = 0; i < jobLinks.length; i += BATCH_SIZE) {
    if (isClosed()) {
      break;
    }
    
    // Check if task has been aborted
    if (taskAbortController && taskAbortController.signal.aborted) {
      console.info(`[parallelProcessor] task ${taskId} aborted, stopping processing`);
      break;
    }

    const batch = jobLinks.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (link, batchIndex) => {
      const globalIndex = i + batchIndex;
      
      // Check if this job URL should be skipped based on URL pattern
      const skipCheck = shouldSkipJobUrl(link);
      if (skipCheck.skip) {
        console.info(`[parallelProcessor] skipping job URL: ${link} - ${skipCheck.reason}`);
        sendMessage('progress', {
          message: `Skipping job ${globalIndex + 1}/${jobLinks.length} - ${skipCheck.reason}`,
          current: globalIndex + 1,
          total: jobLinks.length,
          url: link
        });
        return { success: true, record: null, index: globalIndex, skipped: true };
      }

      // Check if this job URL already exists
      if (existingUrls.has(link)) {
        console.info(`[parallelProcessor] skipping duplicate job URL: ${link}`);
        sendMessage('progress', {
          message: `Skipping duplicate job ${globalIndex + 1}/${jobLinks.length}`,
          current: globalIndex + 1,
          total: jobLinks.length,
          url: link
        });
        return { success: true, record: null, index: globalIndex, skipped: true };
      }
      
      try {
        sendMessage('progress', {
          message: `Analyzing job ${globalIndex + 1}/${jobLinks.length}`,
          current: globalIndex + 1,
          total: jobLinks.length,
          url: link
        });

        const record = await analyzeSingleJob({ jobUrl: link }, cvProfile, options, taskAbortController || undefined);

        // Update background task with result
        if (taskId) {
          addTaskResult(taskId, record);
        }

        sendMessage('result', {
          record,
          index: globalIndex,
          total: jobLinks.length
        });

        return { success: true, record, index: globalIndex };
      } catch (error) {
        const message = extractErrorMessage(error);

        // Handle skip errors differently - don't treat as failures
        if (error instanceof Error && error.message.includes('Job skipped due to empty title')) {
          console.info(`[api/analyze/stream] Skipping job due to empty title: ${link}`);
          sendMessage('progress', {
            message: `Skipped job ${globalIndex + 1}/${jobLinks.length} - empty title`,
            current: globalIndex + 1,
            total: jobLinks.length,
            url: link
          });
          return { success: true, record: null, index: globalIndex, skipped: true };
        }

        console.warn(`[api/analyze/stream] failed for ${link}`, error);

        // Update background task with error
        if (taskId) {
          addTaskError(taskId, { url: link, message });
        }

        sendMessage('error', {
          url: link,
          message,
          index: globalIndex,
          total: jobLinks.length
        });

        return { success: false, error: { url: link, message }, index: globalIndex };
      }
    });

    // Wait for all jobs in this batch to complete
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Process results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        const { success, record, error, index, skipped } = result.value;
        if (success && record && !skipped) {
          records.push(record);
        } else if (error) {
          errors.push(error);
        }
        // Skip processing for skipped duplicates
      } else {
        // Handle unexpected promise rejection
        console.warn('[api/analyze/stream] unexpected promise rejection:', result.reason);
      }
    }
  }

  return { records, errors };
}
