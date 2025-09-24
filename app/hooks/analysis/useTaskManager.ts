import { useCallback } from "react";
import type { BackgroundTask } from "@/lib/schemas";

interface UseTaskManagerProps {
  startTask: (searchUrl: string) => Promise<BackgroundTask>;
  loadAnalyses: () => Promise<void>;
  clearAllTasks: () => void;
}

export function useTaskManager({
  startTask,
  loadAnalyses,
  clearAllTasks,
}: UseTaskManagerProps) {
  // Enhanced startTask that refreshes data after completion
  const enhancedStartTask = useCallback(async (searchUrl: string) => {
    const task = await startTask(searchUrl);

    // Add a small delay to allow the task to complete, then refresh
    setTimeout(() => {
      loadAnalyses();
    }, 2000);

    return task;
  }, [startTask, loadAnalyses]);

  return {
    enhancedStartTask,
    clearAllTasks,
  };
}
