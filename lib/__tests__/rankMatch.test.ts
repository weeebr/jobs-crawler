import { describe, it, expect, vi, beforeEach } from "vitest";
import { rankMatchScore } from "../rankMatch";
import type { CVProfile, JobAdParsed } from "../schemas";
import type { ComparisonResult } from "../compareCv";

// Mock environment variables
const originalEnv = process.env;

describe("rankMatchScore", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  const mockJob: JobAdParsed = {
    title: "Senior React Developer",
    company: "TechCorp",
    stack: ["React", "TypeScript", "Node.js"],
    qualifications: ["5+ years React experience"],
    roles: ["Build user interfaces"],
    benefits: ["Health insurance"],
    fetchedAt: Date.now(),
  };

  const mockCv: CVProfile = {
    roles: [
      {
        title: "Frontend Developer",
        stack: ["React", "JavaScript"],
        years: 3,
      },
    ],
    skills: ["React", "TypeScript"],
    projects: [],
    education: [],
    keywords: ["frontend", "react"],
  };

  const mockHeuristics: ComparisonResult = {
    matchScore: 75,
    gaps: ["Node.js"],
    reasoning: ["Strong React experience", "Missing Node.js skills"],
  };

  it("falls back to heuristics when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await rankMatchScore({
      job: mockJob,
      cv: mockCv,
      heuristics: mockHeuristics,
    });

    expect(result.source).toBe("heuristic");
    expect(result.matchScore).toBe(75);
    expect(result.reasoning).toContain("LLM scoring unavailable - no API key");
  });

  it("falls back to heuristics when OpenAI API fails", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    
    // Mock fetch to return error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    });

    const result = await rankMatchScore({
      job: mockJob,
      cv: mockCv,
      heuristics: mockHeuristics,
    });

    expect(result.source).toBe("heuristic");
    expect(result.matchScore).toBe(75);
  });

  it("uses LLM when API key is present and request succeeds", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              matchScore: 85,
              reasoning: "Strong React experience matches job requirements",
            }),
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await rankMatchScore({
      job: mockJob,
      cv: mockCv,
      heuristics: mockHeuristics,
    });

    expect(result.source).toBe("llm");
    expect(result.matchScore).toBe(85);
    expect(result.reasoning).toBe("Strong React experience matches job requirements");
  });

  it("clamps LLM scores to valid range", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              matchScore: 85, // Valid score
              reasoning: "Test reasoning",
            }),
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await rankMatchScore({
      job: mockJob,
      cv: mockCv,
      heuristics: mockHeuristics,
    });

    expect(result.source).toBe("llm");
    expect(result.matchScore).toBe(85);
  });
});
