import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { analysisStorage } from "@/lib/analysisStorageHandler";
import {
  createMockAnalysis,
  createInvalidAnalysisRecord
} from "./testUtils/analysisStoreTestUtils";

// Mock localStorage for tests
const localStorageMock = (() => {
  const store = new Map();
  const mockStorage = {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() { return store.size; },
    key: vi.fn((index: number) => Array.from(store.keys())[index] || null),
    get store() { return store; }, // Expose store for test cleanup
  };

  // Override Object.keys to return the stored data keys
  Object.defineProperty(mockStorage, Symbol.iterator, {
    value: () => store[Symbol.iterator](),
    enumerable: false
  });

  return mockStorage;
})();

// Mock global.localStorage
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe("Analysis Storage - Critical Data Operations", () => {
  beforeEach(() => {
    localStorageMock.store.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.store.clear();
    vi.clearAllMocks();
  });

  it("should save and retrieve analysis records", () => {
    const analysis = createMockAnalysis(123);
    const saved = analysisStorage.save(analysis);

    expect(saved.id).toBe(123);

    const retrieved = analysisStorage.getById(123);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(123);
    expect(retrieved?.job.title).toBe("Test Job");
  });


  it("should list analyses in correct order (newest first)", () => {
    const now = Date.now();
    const analysis1 = createMockAnalysis(1);
    analysis1.createdAt = now - 2000; // 2 seconds ago
    const analysis2 = createMockAnalysis(2);
    analysis2.createdAt = now; // Most recent
    const analysis3 = createMockAnalysis(3);
    analysis3.createdAt = now - 1000; // 1 second ago

    // Save in different order
    analysisStorage.save(analysis1);
    analysisStorage.save(analysis3);
    analysisStorage.save(analysis2);

    const analyses = analysisStorage.list();
    expect(analyses).toHaveLength(3);
    // The order should be by creation time, with most recent first
    expect(analyses[0].id).toBe(2); // Most recent
    expect(analyses[1].id).toBe(3);
    expect(analyses[2].id).toBe(1); // Oldest
  });

  it("should limit list results correctly", () => {
    const now = Date.now();
    // Create 5 analyses with different timestamps
    for (let i = 1; i <= 5; i++) {
      const analysis = createMockAnalysis(i);
      analysis.createdAt = now - (5 - i) * 1000; // Each 1 second apart
      analysisStorage.save(analysis);
    }

    const limited = analysisStorage.list(3);
    expect(limited).toHaveLength(3);
    expect(limited[0].id).toBe(5); // Most recent
  });

  it("should delete analysis records", () => {
    const analysis = createMockAnalysis(789);
    analysisStorage.save(analysis);

    expect(analysisStorage.getById(789)).toBeDefined();

    const deleted = analysisStorage.remove(789);
    expect(deleted).toBe(true);
    expect(analysisStorage.getById(789)).toBeUndefined();
  });

  it("should handle deletion of non-existent records", () => {
    const deleted = analysisStorage.remove(999);
    expect(deleted).toBe(false);
  });

  it("should clear all analyses", () => {
    analysisStorage.save(createMockAnalysis(1));
    analysisStorage.save(createMockAnalysis(2));

    expect(analysisStorage.list()).toHaveLength(2);

    analysisStorage.clear();
    expect(analysisStorage.list()).toHaveLength(0);
  });

  it("should validate data schemas on save", () => {
    const invalidRecord = createInvalidAnalysisRecord();
    expect(() => analysisStorage.save(invalidRecord as any)).toThrow();
  });
});
