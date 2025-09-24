"use client";

import type { AnalysisRecord, BackgroundTask } from "./types";
import { safeParseAnalysisRecord } from "./contractValidation";

// Helper function to get API key for requests
async function getApiKey(): Promise<string> {
  return process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
}

// Helper function to make authenticated requests
async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = await getApiKey();

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...options.headers,
    },
  });
}

export interface StreamMessageHandler {
  handleMessage: (message: { type: string; data: unknown }, taskId: string, setTasks: (updater: (prev: BackgroundTask[]) => BackgroundTask[]) => void) => void;
}

export function createStreamMessageHandler(): StreamMessageHandler {
  const handleMessage = (message: { type: string; data: unknown }, taskId: string, setTasks: (updater: (prev: BackgroundTask[]) => BackgroundTask[]) => void) => {
    switch (message.type) {
      case 'progress':
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                progress: {
                  ...task.progress,
                  total: (message.data && typeof message.data === 'object' && 'total' in message.data && typeof message.data.total === 'number')
                    ? message.data.total
                    : task.progress.total,
                  completed: (message.data && typeof message.data === 'object' && 'completed' in message.data && typeof message.data.completed === 'number')
                    ? message.data.completed
                    : task.progress.completed,
                  current: (message.data && typeof message.data === 'object' && 'current' in message.data && typeof message.data.current === 'string')
                    ? message.data.current
                    : task.progress.current,
                  message: (message.data && typeof message.data === 'object' && 'message' in message.data && typeof message.data.message === 'string')
                    ? message.data.message
                    : task.progress.message,
                  url: (message.data && typeof message.data === 'object' && 'url' in message.data && typeof message.data.url === 'string')
                    ? message.data.url
                    : task.progress.url
                }
              }
            : task
        ));
        break;

      case 'result':
        const recordData = (message.data && typeof message.data === 'object' && 'record' in message.data)
          ? message.data.record
          : undefined;
        const parsedRecord = safeParseAnalysisRecord(recordData, 'sse.result');
        if (!parsedRecord) {
          break;
        }

        // Save to API instead of direct database access
        apiRequest('/api/analyses', {
          method: 'POST',
          body: JSON.stringify(parsedRecord),
        }).catch(error => {
          console.error('[streamHandlers] Failed to save analysis to API:', error);
        });
        
        setTasks(prev => {
          const updated = prev.map(task => 
            task.id === taskId 
              ? { 
                  ...task, 
                  results: [...task.results, parsedRecord],
                  progress: { 
                    ...task.progress, 
                    completed: task.progress.completed + 1
                  }
                }
              : task
          );
          return updated;
        });
        break;

      case 'error':
        const errorData = (message.data && typeof message.data === 'object' && 'message' in message.data && 'url' in message.data)
          ? { message: String(message.data.message), url: String(message.data.url) }
          : { message: 'Unknown error', url: 'Unknown' };
        setTasks(prev => prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                errors: [...task.errors, errorData]
              }
            : task
        ));
        break;

      case 'complete':
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: 'completed',
                completedAt: Date.now()
              }
            : task
        ));
        break;
    }
  };

  return { handleMessage };
}
