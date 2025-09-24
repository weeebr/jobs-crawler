import { describe, expect, it, beforeEach, vi } from "vitest";
import { addTaskResult, addTaskError } from "@/lib/backgroundTasks";
import { getExistingJobUrls } from "@/lib/clientStorage/core";
import {
  createMockCvProfile,
  createMockAnalysisRecord,
  createMockMessageCollector,
  createMockIsClosed
} from "../testUtils/streamingTestUtils";

// Mock dependencies
vi.mock("@/lib/streaming/jobAnalysis", () => ({
  analyzeSingleJob: vi.fn()
}));
vi.mock("@/lib/backgroundTasks");
vi.mock("@/lib/clientStorage/core");

// Import after mocking
import { processJobLinksInParallel } from "@/lib/streaming/parallelProcessor";
import { analyzeSingleJob } from "@/lib/streaming/jobAnalysis";

const analyzeSingleJobMock = vi.mocked(analyzeSingleJob);
const addTaskResultMock = vi.mocked(addTaskResult);
const addTaskErrorMock = vi.mocked(addTaskError);
const getExistingJobUrlsMock = vi.mocked(getExistingJobUrls);

describe("Streaming 2-Stage Processing - Duplicate and Cancellation", () => {
  const mockCvProfile = createMockCvProfile();
  const mockAnalysisRecord = createMockAnalysisRecord();

  beforeEach(() => {
    vi.clearAllMocks();
    getExistingJobUrlsMock.mockReturnValue(new Set());
  });

  it("should handle duplicate job URLs by skipping them", async () => {
    const jobLinks = [
      "https://jobs.ch/vacancies/detail/job1",
      "https://jobs.ch/vacancies/detail/job2"
    ];

    // Mock existing URLs
    getExistingJobUrlsMock.mockReturnValue(new Set([
      "https://jobs.ch/vacancies/detail/job1"
    ]));

    const { messages, sendMessage } = createMockMessageCollector();
    const isClosed = createMockIsClosed(10); // Don't close early

    const result = await processJobLinksInParallel(
      jobLinks,
      mockCvProfile,
      { clearJobAdData: false },
      "task-123",
      sendMessage,
      isClosed
    );

    // Verify only non-duplicate job was processed
    expect(analyzeSingleJobMock).toHaveBeenCalledTimes(1);
    expect(analyzeSingleJobMock).toHaveBeenCalledWith(
      { jobUrl: "https://jobs.ch/vacancies/detail/job2" },
      mockCvProfile,
      { clearJobAdData: false },
      undefined
    );

    // Verify skip messages
    const skipMessages = messages.filter(m => m.type === 'progress' && m.data.message.includes('Skipping'));
    expect(skipMessages).toHaveLength(1);
  });

  it("should respect cancellation signal", async () => {
    const jobLinks = [
      "https://jobs.ch/vacancies/detail/job1",
      "https://jobs.ch/vacancies/detail/job2",
      "https://jobs.ch/vacancies/detail/job3"
    ];

    const { messages, sendMessage } = createMockMessageCollector();
    const isClosed = createMockIsClosed(1); // Close after first batch

    // Mock successful job analysis
    analyzeSingleJobMock.mockResolvedValue(mockAnalysisRecord);

    const result = await processJobLinksInParallel(
      jobLinks,
      mockCvProfile,
      { clearJobAdData: false },
      "task-123",
      sendMessage,
      isClosed
    );

    // Verify early termination
    expect(analyzeSingleJobMock).toHaveBeenCalledTimes(3); // Only first batch
    expect(result.records).toHaveLength(3);
  });
});
