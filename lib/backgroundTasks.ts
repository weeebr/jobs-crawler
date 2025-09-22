import type { AnalysisRecord } from "./types";

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
  };
  results: AnalysisRecord[];
  errors: { url: string; message: string }[];
  startedAt: number;
  completedAt?: number;
}

type GlobalWithTasks = typeof globalThis & {
  __backgroundTasks?: Map<string, BackgroundTask>;
  __cancelledTasks?: Set<string>;
  __abortControllers?: Map<string, AbortController>;
};

const globalTasks = globalThis as GlobalWithTasks;

if (!globalTasks.__backgroundTasks) {
  globalTasks.__backgroundTasks = new Map<string, BackgroundTask>();
}

if (!globalTasks.__cancelledTasks) {
  globalTasks.__cancelledTasks = new Set<string>();
}

if (!globalTasks.__abortControllers) {
  globalTasks.__abortControllers = new Map<string, AbortController>();
}

const tasks = globalTasks.__backgroundTasks;
const cancelledTasks = globalTasks.__cancelledTasks;
const abortControllers = globalTasks.__abortControllers;

export function createBackgroundTask(searchUrl: string): BackgroundTask {
  const task: BackgroundTask = {
    id: crypto.randomUUID(),
    searchUrl,
    status: 'running',
    progress: {
      total: 0,
      completed: 0,
    },
    results: [],
    errors: [],
    startedAt: Date.now(),
  };

  // Create AbortController for this task
  const abortController = new AbortController();
  abortControllers.set(task.id, abortController);

  tasks.set(task.id, task);
  return task;
}

export function getBackgroundTask(id: string): BackgroundTask | undefined {
  return tasks.get(id);
}

export function updateTaskProgress(
  taskId: string,
  progress: Partial<BackgroundTask['progress']>
): boolean {
  const task = tasks.get(taskId);
  if (!task) return false;

  task.progress = { ...task.progress, ...progress };
  return true;
}

export function addTaskResult(
  taskId: string,
  result: AnalysisRecord
): boolean {
  const task = tasks.get(taskId);
  if (!task) return false;

  task.results.push(result);
  task.progress.completed = task.results.length;
  return true;
}

export function addTaskError(
  taskId: string,
  error: { url: string; message: string }
): boolean {
  const task = tasks.get(taskId);
  if (!task) return false;

  task.errors.push(error);
  return true;
}

export function completeTask(
  taskId: string,
  status: 'completed' | 'failed' | 'cancelled' = 'completed'
): boolean {
  const task = tasks.get(taskId);
  if (!task) return false;

  task.status = status;
  task.completedAt = Date.now();
  return true;
}

export function listActiveTasks(): BackgroundTask[] {
  return Array.from(tasks.values())
    .filter(task => task.status === 'running')
    .sort((a, b) => b.startedAt - a.startedAt);
}

export function listAllTasks(limit = 50): BackgroundTask[] {
  return Array.from(tasks.values())
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, limit);
}

export function cancelTask(taskId: string): boolean {
  const task = tasks.get(taskId);
  if (!task || task.status !== 'running') return false;

  task.status = 'cancelled';
  task.completedAt = Date.now();
  
  // Add to global cancellation set for immediate checking
  cancelledTasks.add(taskId);
  
  // Abort the task's AbortController
  const abortController = abortControllers.get(taskId);
  if (abortController) {
    abortController.abort();
    abortControllers.delete(taskId);
  }
  
  console.info(`[backgroundTasks] cancelled task ${taskId} - status set to cancelled and aborted`);
  return true;
}

export function isTaskCancelled(taskId: string): boolean {
  return cancelledTasks.has(taskId);
}

export function getTaskAbortController(taskId: string): AbortController | undefined {
  return abortControllers.get(taskId);
}

export function cleanupOldTasks(maxAge = 24 * 60 * 60 * 1000): number {
  const cutoff = Date.now() - maxAge;
  let cleaned = 0;

  for (const [id, task] of tasks.entries()) {
    if (task.completedAt && task.completedAt < cutoff) {
      tasks.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}
