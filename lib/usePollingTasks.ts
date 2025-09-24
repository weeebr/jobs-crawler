"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { BackgroundTask } from "./types";
import { requireTaskResponse } from "./contractValidation";

export interface UsePollingTasksReturn {
  tasks: BackgroundTask[];
  activeTasks: BackgroundTask[];
  startTask: (searchUrl: string) => Promise<BackgroundTask>;
  cancelTask: (taskId: string) => Promise<boolean>;
  clearAllTasks: () => Promise<void>;
  isPolling: boolean;
  currentTaskId: string | null;
}

interface UsePollingTasksOptions {
  onError?: (message: string) => void;
  onResultRefresh?: () => void;
  pollInterval?: number;
}

export function usePollingTasks(options?: UsePollingTasksOptions): UsePollingTasksReturn {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollInterval = options?.pollInterval ?? 2000; // 2 seconds

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const raw = await response.json();
        const parsed = requireTaskResponse(raw, 'usePollingTasks.loadTasks');
        setTasks(parsed.tasks);
      }
    } catch (error) {
      console.warn('Failed to load tasks:', error);
    }
  }, []);

  const pollTaskProgress = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/progress`);
      if (response.ok) {
        const data = await response.json();

        // Check if results count has changed
        const prevTask = tasks.find(t => t.id === taskId);
        const resultsCountChanged = prevTask && data.resultsCount !== undefined && data.resultsCount !== prevTask.results?.length;
        const hasNewResults = resultsCountChanged && (data.resultsCount || 0) > (prevTask?.results?.length || 0);

        setTasks(prev => prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                status: data.status,
                progress: {
                  ...task.progress,
                  ...data.progress
                },
                results: data.resultsCount !== undefined ? new Array(data.resultsCount).fill(null) : task.results,
                errors: data.errorsCount !== undefined ? new Array(data.errorsCount).fill({ url: '', message: '' }) : task.errors,
                completedAt: data.completed ? Date.now() : task.completedAt
              }
            : task
        ));

        // Refresh analyses if we have new results (to update job ads cards)
        if (hasNewResults && options?.onResultRefresh) {
          options.onResultRefresh();
        }

        // Continue polling if task is not completed
        if (!data.completed) {
          pollIntervalRef.current = setTimeout(() => pollTaskProgress(taskId), pollInterval);
        } else {
          setIsPolling(false);
          setCurrentTaskId(null);
          // Final refresh when task completes
          options?.onResultRefresh?.();
        }
      } else {
        console.warn(`Failed to poll task progress for ${taskId}:`, response.statusText);
      }
    } catch (error) {
      console.warn(`Error polling task progress for ${taskId}:`, error);
    }
  }, [pollInterval, options, tasks]);

  const startTask = useCallback(async (searchUrl: string): Promise<BackgroundTask> => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to create background task');
      }

      const payload = await response.json();
      const task = requireTaskResponse(payload, 'usePollingTasks.startTask').tasks[0];

      setTasks(prev => [task, ...prev]);
      setIsPolling(true);
      setCurrentTaskId(task.id);

      // Start polling for this task
      pollIntervalRef.current = setTimeout(() => pollTaskProgress(task.id), pollInterval);

      return task;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      options?.onError?.(message);
      throw error;
    }
  }, [pollInterval, pollTaskProgress, options]);

  const cancelTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(prev => prev.map(task =>
          task.id === taskId
            ? { ...task, status: 'cancelled', completedAt: Date.now() }
            : task
        ));

        // Stop polling for this task
        if (pollIntervalRef.current) {
          clearTimeout(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsPolling(false);
        setCurrentTaskId(null);

        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to cancel task:', error);
      return false;
    }
  }, []);

  const clearAllTasks = useCallback(async () => {
    try {
      // Stop any active polling
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsPolling(false);
      setCurrentTaskId(null);

      const response = await fetch('/api/tasks?cleanup=true', {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks([]);
      }
    } catch (error) {
      console.warn('Failed to clear tasks:', error);
    }
  }, []);

  const activeTasks = tasks.filter(task => task.status === 'running');

  useEffect(() => {
    loadTasks();
    return () => {
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
      }
    };
  }, [loadTasks]);

  return {
    tasks,
    activeTasks,
    startTask,
    cancelTask,
    clearAllTasks,
    isPolling,
    currentTaskId,
  };
}
