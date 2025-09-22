"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { AnalysisRecord } from "./types";
import { createStreamMessageHandler } from "./streamHandlers";
import { createTaskOperations } from "./taskOperations";

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
  clearAllTasks: () => Promise<void>;
  isStreaming: boolean;
  currentStream: EventSource | null;
}

interface UseBackgroundTasksOptions {
  onError?: (message: string) => void;
}

export function useBackgroundTasks(options?: UseBackgroundTasksOptions): UseBackgroundTasksReturn {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStream, setCurrentStream] = useState<EventSource | null>(null);
  const streamRef = useRef<EventSource | null>(null);
  
  const streamHandler = createStreamMessageHandler();
  const taskOps = createTaskOperations();

  const activeTasks = tasks.filter(task => task.status === 'running');

  useEffect(() => {
    loadTasks();
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.warn('Failed to load tasks:', error);
    }
  }, []);

  const startTask = useCallback(async (searchUrl: string, clearJobAdData?: boolean): Promise<BackgroundTask> => {
    taskOps.validateApiKey(options?.onError);
    const { task } = await taskOps.createTask(searchUrl);
    setTasks(prev => [task, ...prev]);
    setIsStreaming(true);

    const streamResponse = await taskOps.startStream(searchUrl, task.id, clearJobAdData);

    const reader = streamResponse.body?.getReader();
    if (!reader) throw new Error('No response body reader available');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              streamHandler.handleMessage(JSON.parse(line.slice(6)), task.id, setTasks);
            } catch (parseError) {
              console.warn('Failed to parse SSE message:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      setIsStreaming(false);
      setCurrentStream(null);
    }

    return task;
  }, [taskOps, streamHandler]);

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

  const clearAllTasks = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
    
    await taskOps.clearAllTasks(tasks);
    setTasks([]);
    setIsStreaming(false);
    setCurrentStream(null);
  }, [taskOps, tasks]);

  return {
    tasks,
    activeTasks,
    startTask,
    cancelTask,
    clearAllTasks,
    isStreaming,
    currentStream,
  };
}
