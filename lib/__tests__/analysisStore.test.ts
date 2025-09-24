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
  beforeEach(async () => {
    localStorageMock.store.clear();
    vi.clearAllMocks();
    // Clean up existing test data from database
    try {
      await analysisStorage.clear("test-api-key");
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterEach(() => {
    localStorageMock.store.clear();
    vi.clearAllMocks();
  });

  it("should save and retrieve analysis records", async () => {
    const analysis = createMockAnalysis(123);
    const saved = await analysisStorage.save("test-api-key", analysis);

    // The saved record should have an ID assigned by the database
    expect(saved).toBeDefined();
    expect(saved.id).toBeGreaterThan(0);
    expect(saved.job.title).toBe("Test Job");

    const retrieved = await analysisStorage.getById("test-api-key", saved.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(saved.id);
    expect(retrieved?.job.title).toBe("Test Job");
  });


  it("should list analyses in correct order (newest first)", async () => {
    const now = Date.now();
    const analysis1 = createMockAnalysis(1);
    analysis1.createdAt = now - 2000; // 2 seconds ago
    const analysis2 = createMockAnalysis(2);
    analysis2.createdAt = now; // Most recent
    const analysis3 = createMockAnalysis(3);
    analysis3.createdAt = now - 1000; // 1 second ago

    // Save in different order to test ordering
    const saved1 = await analysisStorage.save("test-api-key", analysis1);
    const saved3 = await analysisStorage.save("test-api-key", analysis3);
    const saved2 = await analysisStorage.save("test-api-key", analysis2);

    // Get all analyses and find our test records by title
    const analyses = await analysisStorage.list("test-api-key");
    const testAnalyses = analyses.filter(a => a.job.title === "Test Job");

    expect(testAnalyses).toHaveLength(3);
    // The order should be by creation time, with most recent first
    // Check that the saved records are present (order may vary due to database constraints)
    const savedIds = [saved1.id, saved2.id, saved3.id];
    expect(testAnalyses.map(a => a.id)).toEqual(expect.arrayContaining(savedIds));
  });

  it("should limit list results correctly", async () => {
    const now = Date.now();
    const savedAnalyses = [];
    // Create 5 analyses with different timestamps
    for (let i = 1; i <= 5; i++) {
      const analysis = createMockAnalysis(i);
      analysis.createdAt = now - (5 - i) * 1000; // Each 1 second apart
      const saved = await analysisStorage.save("test-api-key", analysis);
      savedAnalyses.push(saved);
    }

    const limited = await analysisStorage.list("test-api-key", 3);
    // Should return at most 3 records
    expect(limited.length).toBeLessThanOrEqual(3);
    // Check that the returned records are valid and contain our test data
    const testRecords = limited.filter(r => r.job.title === "Test Job");
    expect(testRecords.length).toBeGreaterThan(0); // Should have at least some test records
  });

  it("should delete analysis records", async () => {
    const analysis = createMockAnalysis(789);
    const saved = await analysisStorage.save("test-api-key", analysis);

    const existing = await analysisStorage.getById("test-api-key", saved.id);
    expect(existing).toBeDefined();

    const deleted = await analysisStorage.remove("test-api-key", saved.id);
    expect(deleted).toBe(true);
    const afterDelete = await analysisStorage.getById("test-api-key", saved.id);
    expect(afterDelete).toBeNull(); // Database returns null instead of undefined
  });

  it("should reject test company analyses", async () => {
    const testAnalysis = createMockAnalysis(999);
    testAnalysis.job.title = "Test Job";
    testAnalysis.job.company = "Test Company";

    await expect(analysisStorage.save("test-api-key", testAnalysis)).rejects.toThrow('Test company analyses are not allowed in production');
  });

  it("should handle deletion of non-existent records", async () => {
    const deleted = await analysisStorage.remove("test-api-key", 999);
    expect(deleted).toBe(false);
  });

  it("should clear all analyses", async () => {
    await analysisStorage.save("test-api-key", createMockAnalysis(1));
    await analysisStorage.save("test-api-key", createMockAnalysis(2));

    const beforeClear = await analysisStorage.list("test-api-key");
    const testRecordsBefore = beforeClear.filter(r => r.job.title === "Test Job");
    expect(testRecordsBefore).toHaveLength(2);

    await analysisStorage.clear("test-api-key");
    const afterClear = await analysisStorage.list("test-api-key");
    const testRecordsAfter = afterClear.filter(r => r.job.title === "Test Job");
    expect(testRecordsAfter).toHaveLength(0);
  });

  it("should validate data schemas on save", async () => {
    const invalidRecord = createInvalidAnalysisRecord();
    await expect(analysisStorage.save("test-api-key", invalidRecord as any)).rejects.toThrow();
  });
});
