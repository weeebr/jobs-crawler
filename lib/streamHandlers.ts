"use client";

import type { AnalysisRecord } from "./types";
import { persistAnalysisRecord } from "./clientStorage";

export interface StreamMessageHandler {
  handleMessage: (message: any, taskId: string, setTasks: (updater: (prev: any[]) => any[]) => void) => void;
}

export function createStreamMessageHandler(): StreamMessageHandler {
  const handleMessage = (message: any, taskId: string, setTasks: (updater: (prev: any[]) => any[]) => void) => {
    switch (message.type) {
      case 'progress':
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                progress: { 
                  ...task.progress,
                  total: message.data?.total ?? task.progress.total,
                  completed: message.data?.completed ?? task.progress.completed,
                  current: message.data?.current ?? task.progress.current,
                  message: message.data?.message ?? task.progress.message,
                  url: message.data?.url ?? task.progress.url,
                  phase: message.data?.phase ?? task.progress.phase
                }
              }
            : task
        ));
        break;

      case 'result':
        const result = message.data.record as AnalysisRecord;
        persistAnalysisRecord(result);
        
        setTasks(prev => {
          const updated = prev.map(task => 
            task.id === taskId 
              ? { 
                  ...task, 
                  results: [...task.results, result],
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
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                errors: [...task.errors, message.data]
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
