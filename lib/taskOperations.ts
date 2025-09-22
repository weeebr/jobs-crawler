"use client";

import { getConfig } from "./configStore";

export interface TaskOperations {
  validateApiKey: (onError?: (message: string) => void) => void;
  createTask: (searchUrl: string) => Promise<any>;
  startStream: (searchUrl: string, taskId: string, clearJobAdData?: boolean) => Promise<Response>;
  cancelTask: (taskId: string) => Promise<boolean>;
  clearAllTasks: (tasks: any[]) => Promise<void>;
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

    return response.json();
  };

  const startStream = async (searchUrl: string, taskId: string, clearJobAdData?: boolean) => {
    const response = await fetch('/api/analyze/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchUrl, taskId, clearJobAdData }),
    });

    if (!response.ok) {
      throw new Error('Failed to start streaming analysis');
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

  const clearAllTasks = async (tasks: any[]) => {
    for (const task of tasks) {
      if (task.status === 'running') {
        try {
          await fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' });
        } catch (error) {
          console.warn(`Failed to cancel task ${task.id}:`, error);
        }
      }
    }
    
    try {
      await fetch('/api/analyses', { method: 'DELETE' });
    } catch (error) {
      console.warn('Failed to clear analysis store:', error);
    }
  };

  return {
    validateApiKey,
    createTask,
    startStream,
    cancelTask,
    clearAllTasks,
  };
}
