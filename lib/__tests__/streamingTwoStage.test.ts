import { describe, expect, it, beforeEach, vi } from "vitest";
import { addTaskResult, addTaskError } from "@/lib/backgroundTasks";
import { getExistingJobUrls } from "@/lib/clientStorage/core";
import { 
  createMockCvProfile, 
  createMockAnalysisRecord, 
  createMockJobLinks,
  createMockMessageCollector,
  createMockIsClosed
} from "./testUtils/streamingTestUtils";

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

describe("Streaming 2-Stage Processing - Critical Workflow", () => {
  const mockCvProfile = createMockCvProfile();
  const mockAnalysisRecord = createMockAnalysisRecord();

  beforeEach(() => {
    vi.clearAllMocks();
    getExistingJobUrlsMock.mockReturnValue(new Set());
  });

  it("should process job links in parallel batches with progress updates", async () => {
    const jobLinks = createMockJobLinks();
    const { messages, sendMessage } = createMockMessageCollector();
    const isClosed = createMockIsClosed(10); // Don't close early

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

    // Verify parallel processing
    expect(analyzeSingleJobMock).toHaveBeenCalledTimes(5);
    expect(result.records).toHaveLength(5);
    expect(result.errors).toHaveLength(0);

    // Verify progress messages
    expect(messages.filter(m => m.type === 'progress')).toHaveLength(5);
    expect(messages.filter(m => m.type === 'result')).toHaveLength(5);

    // Verify task updates
    expect(addTaskResultMock).toHaveBeenCalledTimes(5);
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

  it("should handle partial failures in parallel processing", async () => {
    const jobLinks = [
      "https://jobs.ch/vacancies/detail/job1",
      "https://jobs.ch/vacancies/detail/job2",
      "https://jobs.ch/vacancies/detail/job3"
    ];

    const { messages, sendMessage } = createMockMessageCollector();
    const isClosed = createMockIsClosed(10); // Don't close early

    // Mock mixed success/failure
    analyzeSingleJobMock
      .mockResolvedValueOnce(mockAnalysisRecord)
      .mockRejectedValueOnce(new Error("Job 2 failed"))
      .mockResolvedValueOnce(mockAnalysisRecord);

    const result = await processJobLinksInParallel(
      jobLinks,
      mockCvProfile,
      { clearJobAdData: false },
      "task-123",
      sendMessage,
      isClosed
    );

    // Verify mixed results
    expect(result.records).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job2");
    expect(result.errors[0].message).toBe("Job 2 failed");

    // Verify error messages
    const errorMessages = messages.filter(m => m.type === 'error');
    expect(errorMessages).toHaveLength(1);

    // Verify task updates
    expect(addTaskResultMock).toHaveBeenCalledTimes(2);
    expect(addTaskErrorMock).toHaveBeenCalledTimes(1);
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

  it("should handle batch processing with proper error isolation", async () => {
    const jobLinks = [
      "https://jobs.ch/vacancies/detail/job1",
      "https://jobs.ch/vacancies/detail/job2",
      "https://jobs.ch/vacancies/detail/job3"
    ];

    const { messages, sendMessage } = createMockMessageCollector();
    const isClosed = createMockIsClosed(10); // Don't close early

    // Mock one failure in batch
    analyzeSingleJobMock
      .mockResolvedValueOnce(mockAnalysisRecord)
      .mockRejectedValueOnce(new Error("Batch job failed"))
      .mockResolvedValueOnce(mockAnalysisRecord);

    const result = await processJobLinksInParallel(
      jobLinks,
      mockCvProfile,
      { clearJobAdData: false },
      "task-123",
      sendMessage,
      isClosed
    );

    // Verify batch processing handled errors correctly
    expect(result.records).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    
    // Verify all jobs were attempted
    expect(analyzeSingleJobMock).toHaveBeenCalledTimes(3);
  });
});
