"use client";

import type { AnalysisRecord } from "./types";
import { persistAnalysisRecord } from "./clientStorage";
import { safeParseAnalysisRecord } from "./contractValidation";

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
        const parsedRecord = safeParseAnalysisRecord(message?.data?.record, 'sse.result');
        if (!parsedRecord) {
          break;
        }

        persistAnalysisRecord(parsedRecord);
        
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
