import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  createBackgroundTask,
  getBackgroundTask,
  updateTaskProgress,
  addTaskResult,
  addTaskError,
  completeTask,
  cancelTask,
  isTaskCancelled,
  getTaskAbortController,
  cleanupOldTasks
} from "@/lib/backgroundTasks";

describe("Background Tasks - Critical Lifecycle", () => {
  beforeEach(() => {
    // Clear any existing tasks
    cleanupOldTasks(0); // Clean all tasks
  });

  afterEach(() => {
    cleanupOldTasks(0); // Clean up after each test
  });

  it("should create task with proper initial state", () => {
    const task = createBackgroundTask("https://example.com/search");
    
    expect(task.id).toBeDefined();
    expect(task.searchUrl).toBe("https://example.com/search");
    expect(task.status).toBe("running");
    expect(task.progress.total).toBe(0);
    expect(task.progress.completed).toBe(0);
    expect(task.results).toEqual([]);
    expect(task.errors).toEqual([]);
    expect(task.startedAt).toBeGreaterThan(0);
  });

  it("should update task progress correctly", () => {
    const task = createBackgroundTask("https://example.com/search");
    
    const success = updateTaskProgress(task.id, {
      total: 10,
      completed: 3,
      message: "Processing jobs..."
    });
    
    expect(success).toBe(true);
    
    const updatedTask = getBackgroundTask(task.id);
    expect(updatedTask?.progress.total).toBe(10);
    expect(updatedTask?.progress.completed).toBe(3);
    expect(updatedTask?.progress.message).toBe("Processing jobs...");
  });

  it("should add task results and update completion count", () => {
    const task = createBackgroundTask("https://example.com/search");
    
    const mockResult = {
      id: 123,
      job: { title: "Test Job", company: "Test Co" },
      cv: { roles: [], skills: [] },
      llmAnalysis: { matchScore: 80, reasoning: [], letters: {}, analyzedAt: Date.now(), analysisVersion: "1.0" },
      userInteractions: { interactionCount: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const success = addTaskResult(task.id, mockResult);
    expect(success).toBe(true);
    
    const updatedTask = getBackgroundTask(task.id);
    expect(updatedTask?.results).toHaveLength(1);
    expect(updatedTask?.progress.completed).toBe(1);
  });

  it("should handle task cancellation properly", () => {
    const task = createBackgroundTask("https://example.com/search");
    const abortController = getTaskAbortController(task.id);
    
    expect(abortController).toBeDefined();
    expect(isTaskCancelled(task.id)).toBe(false);
    
    const cancelled = cancelTask(task.id);
    expect(cancelled).toBe(true);
    expect(isTaskCancelled(task.id)).toBe(true);
    
    const updatedTask = getBackgroundTask(task.id);
    expect(updatedTask?.status).toBe("cancelled");
    expect(updatedTask?.completedAt).toBeDefined();
  });

  it("should complete task with proper status", () => {
    const task = createBackgroundTask("https://example.com/search");
    
    const success = completeTask(task.id, "completed");
    expect(success).toBe(true);
    
    const updatedTask = getBackgroundTask(task.id);
    expect(updatedTask?.status).toBe("completed");
    expect(updatedTask?.completedAt).toBeDefined();
  });

  it("should handle non-existent task operations gracefully", () => {
    const nonExistentId = "non-existent-id";
    
    expect(updateTaskProgress(nonExistentId, { total: 10 })).toBe(false);
    expect(addTaskResult(nonExistentId, {} as any)).toBe(false);
    expect(cancelTask(nonExistentId)).toBe(false);
    expect(completeTask(nonExistentId)).toBe(false);
    expect(isTaskCancelled(nonExistentId)).toBe(false);
    expect(getTaskAbortController(nonExistentId)).toBeUndefined();
  });

  it("should cleanup old tasks based on age", () => {
    const task = createBackgroundTask("https://example.com/search");
    completeTask(task.id, "completed");
    
    // Manually set old timestamp
    const oldTask = getBackgroundTask(task.id);
    if (oldTask) {
      oldTask.completedAt = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
    }
    
    const cleaned = cleanupOldTasks(24 * 60 * 60 * 1000); // 24 hour cutoff
    expect(cleaned).toBe(1);
    expect(getBackgroundTask(task.id)).toBeUndefined();
  });
});
