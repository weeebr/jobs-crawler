import {
  getTaskById,
  updateTaskProgress,
  addTaskResult,
  addTaskError,
  completeTask,
  getTaskAbortController,
  isTaskCancelled,
} from "./backgroundTasks";
import { analyzeJobsInParallel } from "./jobPipeline";
import { loadCvFromSources } from "./cvLoader";
import { cvProfileSchema, type CVProfile } from "./schemas";
import { analysisStorage } from "./analysisStorageHandler";

export async function processBackgroundTask(taskId: string): Promise<void> {
  const task = getTaskById(taskId);
  if (!task) {
    console.error(`[backgroundTaskProcessor] Task ${taskId} not found`);
    return;
  }

  const abortController = getTaskAbortController(taskId);
  if (!abortController) {
    console.error(`[backgroundTaskProcessor] No abort controller for task ${taskId}`);
    return;
  }

  try {
    console.info(`[backgroundTaskProcessor] Starting analysis for task ${taskId}: ${task.searchUrl}`);

    // Update progress to show we're starting
    updateTaskProgress(taskId, {
      total: 1,
      completed: 0,
      message: "Starting analysis...",
      phase: "job-analysis",
      current: "Initializing",
    });

    // Load CV profile
    let cvProfile: CVProfile;
    const cvSource = await loadCvFromSources();
    if (cvSource.markdown) {
      const { parseCvMarkdown } = await import("@/lib/parseCvMarkdown");
      const parsed = parseCvMarkdown(cvSource.markdown);
      cvProfile = cvProfileSchema.parse(parsed);
    } else {
      const { loadDefaultCv } = await import("@/lib/defaultCv");
      cvProfile = (await loadDefaultCv()).profile;
    }

    // Import required functions
    const { collectJobLinks } = await import("./jobPipeline");
    const { analyzeJob } = await import("./jobPipeline");

    // Create progress callback for link collection
    const progressCallback = (progress: { message: string; total: number; completed: number }) => {
      updateTaskProgress(taskId, {
        total: progress.total,
        completed: progress.completed,
        message: progress.message,
        phase: "link-collection",
        current: `Collecting links: ${progress.completed}/${progress.total}`,
      });
    };

    // First collect job links
    const { jobLinks } = await collectJobLinks(task.searchUrl, {
      fetchOptions: {
        timeoutMs: 8000,
        retryCount: 2,
      },
      maxPages: 12,
      onProgress: progressCallback,
    });

    if (jobLinks.length === 0) {
      completeTask(taskId, 'failed');
      addTaskError(taskId, {
        url: task.searchUrl,
        message: "No job links found on search page"
      });
      return;
    }

    // Update progress to show link collection completion
    updateTaskProgress(taskId, {
      total: jobLinks.length,
      completed: jobLinks.length,
      message: `Found ${jobLinks.length} job links - starting analysis...`,
      phase: "link-collection",
      current: `Links collected: ${jobLinks.length}/${jobLinks.length}`,
    });

    // Brief pause to show completion
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update progress for analysis phase
    updateTaskProgress(taskId, {
      total: jobLinks.length,
      completed: 0,
      message: "Analyzing job postings...",
      phase: "job-analysis",
      current: `Analyzing job 0/${jobLinks.length}`,
    });

    // Analyze all jobs in parallel
    updateTaskProgress(taskId, {
      total: jobLinks.length,
      completed: 0,
      message: "Analyzing all jobs in parallel...",
      phase: "job-analysis",
      current: `Starting parallel analysis of ${jobLinks.length} jobs`,
    });

    const { records, errors } = await analyzeJobsInParallel(
      jobLinks,
      cvProfile,
      {
        fetchOptions: {
          timeoutMs: 8000,
          retryCount: 2,
        },
      },
      process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user"
    );

    // Store all successful results
    for (const record of records) {
      await analysisStorage.save("default-user", record);
      addTaskResult(taskId, record);
    }

    // Add all errors
    for (const error of errors) {
      addTaskError(taskId, error);
    }

    // Complete the task
    updateTaskProgress(taskId, {
      total: jobLinks.length,
      completed: records.length,
      message: `Analysis complete: ${records.length}/${jobLinks.length} jobs analyzed successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
    });

    console.info(`[backgroundTaskProcessor] Completed task ${taskId}: ${records.length} records processed`);

  } catch (error) {
    console.error(`[backgroundTaskProcessor] Error processing task ${taskId}:`, error);

    // Check if task was cancelled
    if (isTaskCancelled(taskId)) {
      completeTask(taskId, 'cancelled');
      return;
    }

    // Mark task as failed
    completeTask(taskId, 'failed');
    addTaskError(taskId, {
      url: task.searchUrl,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function startBackgroundTaskProcessor(taskId: string): Promise<void> {
  // Start the task processing in the background
  // Use setTimeout to avoid blocking the response
  setTimeout(() => {
    processBackgroundTask(taskId);
  }, 100);
}
