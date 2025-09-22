import { describe, expect, it, beforeEach, vi } from "vitest";
import { fetchJobAd } from "@/lib/fetchJobAd";
import { extractJobLinks } from "@/lib/extractJobLinks";
import { parseJobAd } from "@/lib/parseJobAd";
import { compareCv } from "@/lib/compareCv";
import { rankMatchScore } from "@/lib/rankMatch";
import { collectJobLinks } from "@/lib/streaming/jobLinkCollector";
import type { CVProfile } from "@/lib/schemas";

// Mock all dependencies
vi.mock("@/lib/fetchJobAd");
vi.mock("@/lib/extractJobLinks");
vi.mock("@/lib/parseJobAd");
vi.mock("@/lib/compareCv");
vi.mock("@/lib/rankMatch");
vi.mock("@/lib/analysisStore");

const fetchJobAdMock = vi.mocked(fetchJobAd);
const extractJobLinksMock = vi.mocked(extractJobLinks);
const parseJobAdMock = vi.mocked(parseJobAd);
const compareCvMock = vi.mocked(compareCv);
const rankMatchScoreMock = vi.mocked(rankMatchScore);

// Create a testable version of the 2-stage workflow with error handling
async function testTwoStageWorkflowWithErrors(
  searchUrl: string,
  cvProfile: CVProfile,
  clearJobAdData?: boolean
) {
  const fetchOptions = {
    timeoutMs: 6000,
    retryCount: 1,
    clearJobAdData
  };

  // Stage 1: Collect job links
  const { jobLinks } = await collectJobLinks(searchUrl, fetchOptions);
  
  if (jobLinks.length === 0) {
    throw new Error("No job detail links found on search page");
  }

  const records = [];
  const errors = [];

  // Stage 2: Analyze each job
  for (const link of jobLinks) {
    try {
      const html = await fetchJobAd(link, fetchOptions);
      const job = await parseJobAd(html, { sourceUrl: link });
      const comparison = compareCv(job, cvProfile);
      const ranking = await rankMatchScore({
        job,
        cv: cvProfile,
        heuristics: comparison
      });
      
      records.push({
        id: Math.floor(Math.random() * 1000),
        job,
        cv: cvProfile,
        llmAnalysis: {
          matchScore: ranking.matchScore,
          reasoning: comparison.reasoning,
          letters: {},
          analyzedAt: Date.now(),
          analysisVersion: "1.0"
        },
        userInteractions: { interactionCount: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown analysis failure";
      errors.push({ url: link, message });
    }
  }

  if (records.length === 0) {
    throw new Error("Failed to analyze any job ads from the search page");
  }

  return { records, errors };
}

describe("2-Stage Error Handling - Critical Scenarios", () => {
  const mockCvProfile: CVProfile = {
    roles: [{ title: "Developer", stack: ["React", "TypeScript"] }],
    skills: ["JavaScript", "React"],
    projects: [],
    education: [],
    keywords: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle Stage 1 failures (search page fetching)", async () => {
    // Mock search page fetch failure
    fetchJobAdMock.mockRejectedValue(new Error("Search page fetch failed"));

    await expect(
      testTwoStageWorkflowWithErrors(
        "https://jobs.ch/en/vacancies/?term=frontend%20developer",
        mockCvProfile,
        false
      )
    ).rejects.toThrow("Search page fetch failed");
  });

  it("should handle Stage 1 failures (job URL extraction)", async () => {
    // Mock successful search page fetch but failed URL extraction
    fetchJobAdMock.mockResolvedValue("<html>search page</html>");
    extractJobLinksMock.mockReturnValue([]); // No job links found

    await expect(
      testTwoStageWorkflowWithErrors(
        "https://jobs.ch/en/vacancies/?term=frontend%20developer",
        mockCvProfile,
        false
      )
    ).rejects.toThrow("No job detail links found on search page");
  });

  it("should handle Stage 2 failures (individual job fetching)", async () => {
    // Mock successful Stage 1
    fetchJobAdMock
      .mockResolvedValueOnce("<html>search page</html>")
      .mockRejectedValue(new Error("Job page fetch failed"));

    extractJobLinksMock.mockReturnValueOnce([
      "https://jobs.ch/vacancies/detail/job1"
    ]);

    const result = await testTwoStageWorkflowWithErrors(
      "https://jobs.ch/en/vacancies/?term=frontend%20developer",
      mockCvProfile,
      false
    );

    // Verify error handling
    expect(result.records).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job1");
    expect(result.errors[0].message).toBe("Job page fetch failed");
  });

  it("should handle Stage 2 failures (job parsing)", async () => {
    // Mock successful Stage 1
    fetchJobAdMock
      .mockResolvedValueOnce("<html>search page</html>")
      .mockResolvedValueOnce("<html>job page</html>");

    extractJobLinksMock.mockReturnValueOnce([
      "https://jobs.ch/vacancies/detail/job1"
    ]);

    // Mock job parsing failure
    parseJobAdMock.mockRejectedValue(new Error("Failed to parse job ad"));

    const result = await testTwoStageWorkflowWithErrors(
      "https://jobs.ch/en/vacancies/?term=frontend%20developer",
      mockCvProfile,
      false
    );

    // Verify error handling
    expect(result.records).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job1");
    expect(result.errors[0].message).toBe("Failed to parse job ad");
  });

  it("should handle Stage 2 failures (CV comparison)", async () => {
    // Mock successful Stage 1
    fetchJobAdMock
      .mockResolvedValueOnce("<html>search page</html>")
      .mockResolvedValueOnce("<html>job page</html>");

    extractJobLinksMock.mockReturnValueOnce([
      "https://jobs.ch/vacancies/detail/job1"
    ]);

    // Mock successful job parsing
    parseJobAdMock.mockResolvedValue({
      title: "Test Job",
      company: "Test Company",
      stack: ["React", "TypeScript"],
      qualifications: ["3+ years experience"],
      roles: ["Frontend Developer"],
      benefits: ["Remote work"],
      fetchedAt: Date.now(),
      sourceDomain: "example.com"
    });

    // Mock CV comparison failure
    compareCvMock.mockImplementation(() => {
      throw new Error("CV comparison failed");
    });

    const result = await testTwoStageWorkflowWithErrors(
      "https://jobs.ch/en/vacancies/?term=frontend%20developer",
      mockCvProfile,
      false
    );

    // Verify error handling
    expect(result.records).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job1");
    expect(result.errors[0].message).toBe("CV comparison failed");
  });

  it("should handle Stage 2 failures (LLM ranking)", async () => {
    // Mock successful Stage 1
    fetchJobAdMock
      .mockResolvedValueOnce("<html>search page</html>")
      .mockResolvedValueOnce("<html>job page</html>");

    extractJobLinksMock.mockReturnValueOnce([
      "https://jobs.ch/vacancies/detail/job1"
    ]);

    // Mock successful job parsing and CV comparison
    parseJobAdMock.mockResolvedValue({
      title: "Test Job",
      company: "Test Company",
      stack: ["React", "TypeScript"],
      qualifications: ["3+ years experience"],
      roles: ["Frontend Developer"],
      benefits: ["Remote work"],
      fetchedAt: Date.now(),
      sourceDomain: "example.com"
    });

    compareCvMock.mockReturnValue({
      matchScore: 75,
      gaps: ["GraphQL"],
      reasoning: ["Strong React experience"]
    });

    // Mock LLM ranking failure
    rankMatchScoreMock.mockRejectedValue(new Error("LLM ranking failed"));

    const result = await testTwoStageWorkflowWithErrors(
      "https://jobs.ch/en/vacancies/?term=frontend%20developer",
      mockCvProfile,
      false
    );

    // Verify error handling
    expect(result.records).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job1");
    expect(result.errors[0].message).toBe("LLM ranking failed");
  });

  it("should handle mixed success and failure scenarios", async () => {
    // Mock successful Stage 1 with multiple job links
    fetchJobAdMock
      .mockResolvedValueOnce("<html>search page</html>")
      .mockResolvedValueOnce("<html>job page 1</html>")
      .mockResolvedValueOnce("<html>job page 2</html>")
      .mockResolvedValueOnce("<html>job page 3</html>");

    extractJobLinksMock.mockReturnValueOnce([
      "https://jobs.ch/vacancies/detail/job1",
      "https://jobs.ch/vacancies/detail/job2",
      "https://jobs.ch/vacancies/detail/job3"
    ]);

    // Mock mixed success/failure for Stage 2
    parseJobAdMock
      .mockResolvedValueOnce({
        title: "Job 1",
        company: "Company 1",
        stack: ["React"],
        qualifications: ["3+ years"],
        roles: ["Developer"],
        benefits: ["Remote"],
        fetchedAt: Date.now(),
        sourceDomain: "example.com"
      })
      .mockRejectedValueOnce(new Error("Job 2 parsing failed"))
      .mockResolvedValueOnce({
        title: "Job 3",
        company: "Company 3",
        stack: ["TypeScript"],
        qualifications: ["2+ years"],
        roles: ["Developer"],
        benefits: ["Flexible"],
        fetchedAt: Date.now(),
        sourceDomain: "example.com"
      });

    // Mock successful CV comparison and ranking for successful jobs
    compareCvMock.mockReturnValue({
      matchScore: 75,
      gaps: ["GraphQL"],
      reasoning: ["Strong experience"]
    });

    rankMatchScoreMock.mockResolvedValue({
      matchScore: 80,
      reasoning: "Good match",
      source: "llm"
    });

    const result = await testTwoStageWorkflowWithErrors(
      "https://jobs.ch/en/vacancies/?term=frontend%20developer",
      mockCvProfile,
      false
    );

    // Verify mixed results
    expect(result.records).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job2");
    expect(result.errors[0].message).toBe("Job 2 parsing failed");
  });

  it("should handle complete Stage 2 failure (all jobs fail)", async () => {
    // Mock successful Stage 1
    fetchJobAdMock
      .mockResolvedValueOnce("<html>search page</html>")
      .mockResolvedValueOnce("<html>job page</html>");

    extractJobLinksMock.mockReturnValueOnce([
      "https://jobs.ch/vacancies/detail/job1"
    ]);

    // Mock complete Stage 2 failure
    parseJobAdMock.mockRejectedValue(new Error("All jobs failed"));

    await expect(
      testTwoStageWorkflowWithErrors(
        "https://jobs.ch/en/vacancies/?term=frontend%20developer",
        mockCvProfile,
        false
      )
    ).rejects.toThrow("Failed to analyze any job ads from the search page");
  });
});
