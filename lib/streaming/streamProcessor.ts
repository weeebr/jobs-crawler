import { NextRequest } from "next/server";
import { loadDefaultCv } from "@/lib/defaultCv";
import {
  updateTaskProgress,
  addTaskResult,
  addTaskError,
  completeTask,
  getTaskAbortController,
} from "@/lib/backgroundTasks";
import { collectJobLinksWithProgress } from "./jobLinkCollector";
import { processJobLinksInParallel } from "./parallelProcessor";
import { createSSEMessage } from "./streamUtils";
import type { CVProfile } from "@/lib/schemas";
import type { AnalysisRecord } from "@/lib/types";
import { JOB_PIPELINE_DEFAULTS } from "@/lib/jobPipeline";

const FETCH_TIMEOUT_MS = JOB_PIPELINE_DEFAULTS.timeoutMs;
const FETCH_RETRY_COUNT = JOB_PIPELINE_DEFAULTS.retryCount;

export async function processJobSearchStream(
  request: NextRequest,
  searchUrl: string,
  cv: CVProfile | undefined,
  taskId: string | undefined,
  clearJobAdData?: boolean
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const closeStream = () => {
        if (isClosed) return;
        isClosed = true;
        try {
          controller.close();
        } catch (error) {
          console.warn('[api/analyze/stream] failed to close stream:', error);
        }
      };

      const abortHandler = () => {
        console.info('[api/analyze/stream] request aborted by client');
        closeStream();
      };

      request.signal.addEventListener('abort', abortHandler);

      const sendMessage = (type: string, data: unknown) => {
        if (isClosed) return;
        try {
          const message = createSSEMessage(type, data);
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.warn('[api/analyze/stream] failed to send message:', error);
          isClosed = true;
        }
      };

      // Get the AbortController for this task
      const taskAbortController = taskId ? getTaskAbortController(taskId) : null;
      
      // Set up abort signal listener
      if (taskAbortController) {
        taskAbortController.signal.addEventListener('abort', () => {
          console.info(`[api/analyze/stream] task ${taskId} aborted, stopping stream`);
          closeStream();
        });
      }

      try {
        // Load CV profile
        const cvProfile: CVProfile = cv ?? (await loadDefaultCv()).profile;
        
        sendMessage('progress', { message: 'Starting job search analysis...' });

        // Collect job links with progress updates
        const fetchOptions = {
          timeoutMs: FETCH_TIMEOUT_MS,
          retryCount: FETCH_RETRY_COUNT,
          clearJobAdData,
        };

        sendMessage('progress', { 
          message: 'Collecting job links from search pages...',
          phase: 'link-collection'
        });

        const { jobLinks, fetchedPages } = await collectJobLinksWithProgress(
          searchUrl,
          fetchOptions,
          (progress) => {
            // Check if stream is closed
            if (isClosed) return;
            
            sendMessage('progress', {
              message: progress.message,
              phase: 'link-collection',
              total: progress.total,
              completed: progress.completed
            });
            
            // Update background task progress
            if (taskId) {
              updateTaskProgress(taskId, { 
                total: progress.total,
                completed: progress.completed,
                message: progress.message
              });
            }
          }
        );

        sendMessage('progress', { 
          message: `Found ${jobLinks.length} job links across ${fetchedPages} pages`,
          total: jobLinks.length,
          completed: 0,
          phase: 'job-analysis'
        });
        
        // Update background task progress
        if (taskId) {
          updateTaskProgress(taskId, { total: jobLinks.length, completed: 0 });
        }

        if (jobLinks.length === 0) {
          console.info('[api/analyze/stream] No job links found on search page - completing with empty results');
          sendMessage('complete', {
            records: [],
            errors: [],
            total: 0,
            successful: 0,
            failed: 0,
            message: 'No job listings found on the search page. Try a different search URL or check if the page structure has changed.'
          });
          closeStream();
          return;
        }

        // Check if stream is closed before processing
        if (isClosed) return;

        // Process job links in parallel batches
        const { records, errors } = await processJobLinksInParallel(
          jobLinks,
          cvProfile,
          { clearJobAdData },
          taskId,
          sendMessage,
          () => isClosed
        );

        // Complete the background task
        if (taskId) {
          completeTask(taskId, records.length > 0 ? 'completed' : 'failed');
        }
        
        sendMessage('complete', {
          records,
          errors,
          total: jobLinks.length,
          successful: records.length,
          failed: errors.length
        });

        closeStream();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        sendMessage('error', { message });
        closeStream();
      } finally {
        request.signal.removeEventListener('abort', abortHandler);
      }
    }
  });

  return stream;
}
