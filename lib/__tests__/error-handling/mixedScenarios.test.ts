import { describe, expect, it, beforeEach, vi } from "vitest";
import { fetchJobAd } from "@/lib/fetchJobAd";
import { extractJobLinks } from "@/lib/extractJobLinks";
import { parseJobAd } from "@/lib/parseJobAd";
import { compareCv } from "@/lib/compareCv";
import { rankMatchScore } from "@/lib/rankMatch";
import { collectJobLinks } from "@/lib/streaming/jobLinkCollector";
import { analysisStorage } from "@/lib/analysisStorageHandler";
import {
  createMockCvProfile,
  testTwoStageWorkflowWithErrors,
  createMockJobData,
  createMockComparisonResult,
  createMockRankingResult
} from "../testUtils/twoStageErrorTestUtils";
import {
  setupStage1Failure,
  setupStage1UrlExtractionFailure,
  setupStage2JobFetchFailure,
  setupStage2JobParsingFailure,
  setupStage2CvComparisonFailure,
  setupStage2LlmRankingFailure,
  setupMixedSuccessFailure,
  setupCompleteStage2Failure
} from "../testUtils/errorScenarioHelpers";
import {
  expectStage2JobFetchError,
  expectStage2JobParsingError,
  expectStage2CvComparisonError,
  expectStage2LlmRankingError,
  expectMixedSuccessFailure
} from "../testUtils/assertionHelpers";

// Mock all dependencies
vi.mock("@/lib/fetchJobAd");
vi.mock("@/lib/extractJobLinks");
vi.mock("@/lib/parseJobAd");
vi.mock("@/lib/compareCv");
vi.mock("@/lib/rankMatch");
vi.mock("@/lib/analysisStorageHandler");
vi.mock("@/lib/streaming/jobLinkCollector");

const fetchJobAdMock = vi.mocked(fetchJobAd);
const extractJobLinksMock = vi.mocked(extractJobLinks);
const parseJobAdMock = vi.mocked(parseJobAd);
const compareCvMock = vi.mocked(compareCv);
const rankMatchScoreMock = vi.mocked(rankMatchScore);
const analysisStorageMock = vi.mocked(analysisStorage);
const collectJobLinksMock = vi.mocked(collectJobLinks);

describe("2-Stage Error Handling - Mixed Scenarios", () => {
  const mockCvProfile = createMockCvProfile();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle mixed success and failure scenarios", async () => {
    setupMixedSuccessFailure(fetchJobAdMock, extractJobLinksMock, parseJobAdMock, compareCvMock, rankMatchScoreMock, createMockComparisonResult, createMockRankingResult, collectJobLinksMock);

    const result = await testTwoStageWorkflowWithErrors(
      "https://jobs.ch/en/vacancies/?term=frontend%20developer",
      mockCvProfile,
      false,
      fetchJobAdMock,
      extractJobLinksMock,
      parseJobAdMock,
      compareCvMock,
      rankMatchScoreMock,
      collectJobLinksMock
    );

    // Verify mixed results
    expectMixedSuccessFailure(result);
  });

  it("should handle complete Stage 2 failure (all jobs fail)", async () => {
    setupCompleteStage2Failure(fetchJobAdMock, extractJobLinksMock, parseJobAdMock, collectJobLinksMock);

    const result = await testTwoStageWorkflowWithErrors(
      "https://jobs.ch/en/vacancies/?term=frontend%20developer",
      mockCvProfile,
      false,
      fetchJobAdMock,
      extractJobLinksMock,
      parseJobAdMock,
      compareCvMock,
      rankMatchScoreMock,
      collectJobLinksMock
    );

    // Verify complete failure
    expect(result.records).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job1");
    expect(result.errors[0].message).toBe("All jobs failed");
  });
});
