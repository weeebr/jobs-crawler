import { describe, expect, it } from "vitest";
import { analysisStorage } from "@/lib/analysisStorageHandler";
import { createMockAnalysis } from "./testUtils/analysisStoreTestUtils";

describe("Duplicate URL Prevention", () => {
  it("should prevent duplicate URLs from being inserted", async () => {
    const testUrl = "https://example.com/job/duplicate-test";
    const testApiKey = "test-duplicate-prevention-" + Date.now() + "-1";

    // Create first analysis record
    const firstAnalysis = createMockAnalysis(1);
    firstAnalysis.job.sourceUrl = testUrl;
    firstAnalysis.job.title = "First Job";

    // Save the first record
    const savedFirst = await analysisStorage.save(testApiKey, firstAnalysis);
    expect(savedFirst).toBeDefined();
    expect(savedFirst.id).toBeGreaterThan(0);

    // Try to save a second record with the same URL
    const secondAnalysis = createMockAnalysis(2);
    secondAnalysis.job.sourceUrl = testUrl;
    secondAnalysis.job.title = "Second Job (duplicate URL)";

    // Should throw an error when trying to insert duplicate
    await expect(analysisStorage.save(testApiKey, secondAnalysis))
      .rejects.toThrow("Job ad with URL https://example.com/job/duplicate-test already exists for this user");
  });

  it("should allow same URL for different users", async () => {
    const testUrl = "https://example.com/job/different-users-test";
    const user1ApiKey = "test-different-users-1-" + Date.now();
    const user2ApiKey = "test-different-users-2-" + Date.now();

    // Create analysis for first user
    const firstUserAnalysis = createMockAnalysis(1);
    firstUserAnalysis.job.sourceUrl = testUrl;
    firstUserAnalysis.job.title = "Job for User 1";

    const savedFirst = await analysisStorage.save(user1ApiKey, firstUserAnalysis);
    expect(savedFirst).toBeDefined();

    // Create analysis for second user with same URL
    const secondUserAnalysis = createMockAnalysis(2);
    secondUserAnalysis.job.sourceUrl = testUrl;
    secondUserAnalysis.job.title = "Job for User 2";

    const savedSecond = await analysisStorage.save(user2ApiKey, secondUserAnalysis);
    expect(savedSecond).toBeDefined();

    // Both should have different IDs
    expect(savedFirst.id).not.toBe(savedSecond.id);
  });

  it("should allow different URLs for same user", async () => {
    const testApiKey = "test-different-urls-" + Date.now();

    // Create first analysis with URL 1
    const firstAnalysis = createMockAnalysis(1);
    firstAnalysis.job.sourceUrl = "https://example.com/job/1";
    firstAnalysis.job.title = "Job 1";

    const savedFirst = await analysisStorage.save(testApiKey, firstAnalysis);
    expect(savedFirst).toBeDefined();

    // Create second analysis with URL 2
    const secondAnalysis = createMockAnalysis(2);
    secondAnalysis.job.sourceUrl = "https://example.com/job/2";
    secondAnalysis.job.title = "Job 2";

    const savedSecond = await analysisStorage.save(testApiKey, secondAnalysis);
    expect(savedSecond).toBeDefined();

    // Both should be saved successfully
    expect(savedFirst.id).not.toBe(savedSecond.id);
  });

  it("should have working existsByUrl method", async () => {
    const testUrl = "https://example.com/job/exists-test";
    const testApiKey = "test-exists-method-" + Date.now();

    // Check that URL doesn't exist initially
    const existsBefore = await analysisStorage.existsByUrl(testApiKey, testUrl);
    expect(existsBefore).toBe(false);

    // Create and save analysis
    const analysis = createMockAnalysis(1);
    analysis.job.sourceUrl = testUrl;
    await analysisStorage.save(testApiKey, analysis);

    // Check that URL exists now
    const existsAfter = await analysisStorage.existsByUrl(testApiKey, testUrl);
    expect(existsAfter).toBe(true);
  });

  it("should allow records without sourceUrl", async () => {
    const testApiKey = "test-no-url-" + Date.now();

    // Create analysis without sourceUrl
    const analysis = createMockAnalysis(1);
    analysis.job.sourceUrl = undefined;
    analysis.job.title = "Job without URL";

    // Should save successfully
    const saved = await analysisStorage.save(testApiKey, analysis);
    expect(saved).toBeDefined();
    expect(saved.id).toBeGreaterThan(0);
  });
});
