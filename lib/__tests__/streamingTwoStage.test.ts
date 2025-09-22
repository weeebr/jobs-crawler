import { describe, expect, it, beforeEach, vi } from "vitest";
import { processJobLinksInParallel } from "@/lib/streaming/parallelProcessor";
import { analyzeSingleJob } from "@/lib/streaming/jobAnalysis";
import { addTaskResult, addTaskError } from "@/lib/backgroundTasks";
import { getExistingJobUrls } from "@/lib/clientStorage/core";
import type { CVProfile } from "@/lib/schemas";
import type { AnalysisRecord } from "@/lib/types";

// Mock dependencies
vi.mock("@/lib/streaming/jobAnalysis");
vi.mock("@/lib/backgroundTasks");
vi.mock("@/lib/clientStorage/core");

const analyzeSingleJobMock = vi.mocked(analyzeSingleJob);
const addTaskResultMock = vi.mocked(addTaskResult);
const addTaskErrorMock = vi.mocked(addTaskError);
const getExistingJobUrlsMock = vi.mocked(getExistingJobUrls);

describe("Streaming 2-Stage Processing - Critical Workflow", () => {
  const mockCvProfile: CVProfile = {
    roles: [{ title: "Developer", stack: ["React", "TypeScript"] }],
    skills: ["JavaScript", "React"],
    projects: [],
    education: [],
    keywords: []
  };

  const mockAnalysisRecord: AnalysisRecord = {
    id: 123,
    job: {
      title: "Test Job",
      company: "Test Company",
      stack: ["React", "TypeScript"],
      qualifications: ["3+ years experience"],
      roles: ["Frontend Developer"],
      benefits: ["Remote work"],
      fetchedAt: Date.now(),
      sourceDomain: "example.com"
    },
    cv: mockCvProfile,
    llmAnalysis: {
      matchScore: 80,
      reasoning: ["Strong technical match"],
      letters: {},
      analyzedAt: Date.now(),
      analysisVersion: "1.0"
    },
    userInteractions: { interactionCount: 0 },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getExistingJobUrlsMock.mockReturnValue(new Set());
  });

  it("should process job links in parallel batches with progress updates", async () => {
    const jobLinks = [
      "https://jobs.ch/vacancies/detail/job1",
      "https://jobs.ch/vacancies/detail/job2",
      "https://jobs.ch/vacancies/detail/job3",
      "https://jobs.ch/vacancies/detail/job4",
      "https://jobs.ch/vacancies/detail/job5"
    ];

    const messages: Array<{ type: string; data: any }> = [];
    const sendMessage = (type: string, data: any) => {
      messages.push({ type, data });
    };

    const isClosed = () => false;

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

    const messages: Array<{ type: string; data: any }> = [];
    const sendMessage = (type: string, data: any) => {
      messages.push({ type, data });
    };

    const isClosed = () => false;

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
    const skipMessages = messages.filter(m => m.type === 'progress' && m.data.skipped);
    expect(skipMessages).toHaveLength(1);
  });

  it("should handle partial failures in parallel processing", async () => {
    const jobLinks = [
      "https://jobs.ch/vacancies/detail/job1",
      "https://jobs.ch/vacancies/detail/job2",
      "https://jobs.ch/vacancies/detail/job3"
    ];

    const messages: Array<{ type: string; data: any }> = [];
    const sendMessage = (type: string, data: any) => {
      messages.push({ type, data });
    };

    const isClosed = () => false;

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

    const messages: Array<{ type: string; data: any }> = [];
    const sendMessage = (type: string, data: any) => {
      messages.push({ type, data });
    };

    let callCount = 0;
    const isClosed = () => {
      callCount++;
      return callCount > 1; // Close after first batch
    };

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

    const messages: Array<{ type: string; data: any }> = [];
    const sendMessage = (type: string, data: any) => {
      messages.push({ type, data });
    };

    const isClosed = () => false;

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
