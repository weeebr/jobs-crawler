"use client";

import { requireBackgroundTask } from "./contractValidation";
import type { BackgroundTask } from "./schemas/system";

export interface ClearAllTasksOptions {
  preserveAnalyses?: boolean;
}

export interface TaskOperations {
  validateApiKey: (onError?: (message: string) => void) => void;
  createTask: (searchUrl: string) => Promise<{ task: BackgroundTask }>;
  startAnalysis: (searchUrl: string, taskId: string, clearJobAdData?: boolean) => Promise<Response>;
  cancelTask: (taskId: string) => Promise<boolean>;
  clearAllTasks: (tasks: BackgroundTask[], options?: ClearAllTasksOptions) => Promise<void>;
}

export function createTaskOperations(): TaskOperations {
  const validateApiKey = (onError?: (message: string) => void) => {
    // Server-side code handles API key validation with graceful fallbacks
    // Client-side validation is not needed as the server will use environment
    // variables or fallback to heuristic methods
  };

  const createTask = async (searchUrl: string) => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to create background task');
    }

    const payload = await response.json();
    const task = requireBackgroundTask(payload?.task, 'taskOperations.createTask');
    return { task };
  };

  const startAnalysis = async (searchUrl: string, taskId: string, clearJobAdData?: boolean) => {
    // For polling-based approach, we just trigger the analysis
    // The actual analysis happens in the background and is polled via /api/tasks/[id]/progress
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchUrl, taskId, clearJobAdData }),
    });

    if (!response.ok) {
      throw new Error('Failed to start analysis');
    }

    return response;
  };

  const cancelTask = async (taskId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to cancel task:', error);
      return false;
    }
  };

  const clearAllTasks = async (tasks: BackgroundTask[], options?: ClearAllTasksOptions) => {
    for (const task of tasks) {
      if (task.status === 'running') {
        try {
          await fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' });
        } catch (error) {
          console.warn(`Failed to cancel task ${task.id}:`, error);
        }
      }
    }
    
    if (!options?.preserveAnalyses) {
      try {
        await fetch('/api/analyses', { method: 'DELETE' });
      } catch (error) {
        console.warn('Failed to clear analysis store:', error);
      }
    }
  };

  return {
    validateApiKey,
    createTask,
    startAnalysis,
    cancelTask,
    clearAllTasks,
  };
}
