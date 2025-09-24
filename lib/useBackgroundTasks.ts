"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { AnalysisRecord } from "./types";
// Note: This hook is deprecated - use usePollingTasks instead for polling-based approach
import { createTaskOperations, type ClearAllTasksOptions } from "./taskOperations";
import { requireTaskResponse } from "./contractValidation";
import { cancelAllActiveTasks } from "./backgroundTasks";

export interface BackgroundTask {
  id: string;
  searchUrl: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    total: number;
    completed: number;
    current?: string;
    message?: string;
    url?: string;
    phase?: 'link-collection' | 'job-analysis';
  };
  results: AnalysisRecord[];
  errors: { url: string; message: string }[];
  startedAt: number;
  completedAt?: number;
}

interface UseBackgroundTasksReturn {
  tasks: BackgroundTask[];
  activeTasks: BackgroundTask[];
  startTask: (searchUrl: string) => Promise<BackgroundTask>;
  cancelTask: (taskId: string) => Promise<boolean>;
  clearAllTasks: (options?: ClearAllTasksOptions) => Promise<void>;
}

interface UseBackgroundTasksOptions {
  onError?: (message: string) => void;
  onResultRefresh?: () => void;
}

export function useBackgroundTasks(options?: UseBackgroundTasksOptions): UseBackgroundTasksReturn {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  
  // Note: Stream handler removed as we moved to polling-based approach
  const taskOps = createTaskOperations();

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const raw = await response.json();
        const parsed = requireTaskResponse(raw, 'useBackgroundTasks.loadTasks');
        setTasks(parsed.tasks);
      }
    } catch (error) {
      console.warn('Failed to load tasks:', error);
    }
  }, []);

  const activeTasks = tasks.filter(task => task.status === 'running');

  useEffect(() => {
    loadTasks();
    return () => {
      // Cancel any active tasks when component unmounts
      const activeTaskCount = tasks.filter(task => task.status === 'running').length;
      if (activeTaskCount > 0) {
        console.info(`[useBackgroundTasks] cancelling ${activeTaskCount} tasks on component unmount...`);
        cancelAllActiveTasks();
      }
    };
  }, [loadTasks]);

  const startTask = useCallback(async (searchUrl: string, clearJobAdData?: boolean): Promise<BackgroundTask> => {
    // Note: This is deprecated - usePollingTasks should be used instead
    console.warn('[useBackgroundTasks] This hook is deprecated. Consider using usePollingTasks instead.');

    taskOps.validateApiKey(options?.onError);
    const { task } = await taskOps.createTask(searchUrl);
    setTasks(prev => [task, ...prev]);

    // For now, just simulate a completed task since polling is the preferred approach
    setTimeout(() => {
      setTasks(prev => prev.map(t =>
        t.id === task.id
          ? { ...t, status: 'completed', completedAt: Date.now() }
          : t
      ));
      options?.onResultRefresh?.();
    }, 1000);

    return task;
  }, [taskOps, options?.onError]);

  const cancelTask = useCallback(async (taskId: string): Promise<boolean> => {
    const success = await taskOps.cancelTask(taskId);
    if (success) {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'cancelled', completedAt: Date.now() }
          : task
      ));
    }
    return success;
  }, [taskOps]);

  const clearAllTasks = useCallback(async (options?: ClearAllTasksOptions) => {
    await taskOps.clearAllTasks(tasks, options);
    setTasks([]);
  }, [taskOps, tasks]);

  return {
    tasks,
    activeTasks,
    startTask,
    cancelTask,
    clearAllTasks,
  };
}
