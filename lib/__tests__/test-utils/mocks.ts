import { vi } from "vitest";

// Mock Next.js headers for API testing
export const mockHeaders = () => {
  vi.mock("next/headers", () => ({
    headers: vi.fn().mockReturnValue(new Map([['x-api-key', 'test-api-key']])),
    cookies: vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue(null)
    })
  }));
};

// Basic mock dependencies for general API testing
export const setupBasicMocks = () => {
  mockHeaders();

  // Mock global fetch for network error testing
  vi.stubGlobal('fetch', vi.fn());

  vi.mock("@/lib/fetchJobAd", () => ({
    fetchJobAd: vi.fn().mockResolvedValue("<html>Job content</html>")
  }));

  vi.mock("@/lib/parseJobAd", () => ({
    parseJobAd: vi.fn().mockResolvedValue({
      title: "Test Job",
      company: "Test Company",
      stack: ["React", "TypeScript"],
      qualifications: ["3+ years experience"],
      roles: ["Frontend Developer"],
      benefits: ["Remote work"],
      fetchedAt: Date.now()
    })
  }));

  vi.mock("@/lib/compareCv", () => ({
    compareCv: vi.fn().mockReturnValue({
      matchScore: 75,
      gaps: ["GraphQL"],
      reasoning: ["Strong React experience", "Missing GraphQL"]
    })
  }));

  vi.mock("@/lib/rankMatch", () => ({
    rankMatchScore: vi.fn().mockResolvedValue({
      matchScore: 80,
      source: "llm"
    })
  }));

  vi.mock("@/lib/analysisStorageHandler", () => ({
    analysisStorage: {
      save: vi.fn().mockResolvedValue({
        id: 123,
        job: { title: "Test Job", company: "Test Company" },
        cv: { roles: [{ title: "Developer", stack: ["React"] }], skills: ["JavaScript"] },
        llmAnalysis: { matchScore: 80, gaps: ["GraphQL"], reasoning: ["Strong React experience"] },
        userInteractions: {},
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
    }
  }));

  vi.mock("@/lib/cvLoader", () => ({
    loadCvFromSources: vi.fn().mockResolvedValue({
      markdown: null
    })
  }));

  vi.mock("@/lib/defaultCv", () => ({
    loadDefaultCv: vi.fn().mockResolvedValue({
      profile: {
        roles: [{ title: "Developer", stack: ["React"] }],
        skills: ["JavaScript"],
        projects: [],
        education: [],
        keywords: []
      }
    })
  }));

  vi.mock("@/lib/schemas", () => ({
    cvProfileSchema: {
      parse: vi.fn((data) => data),
      safeParse: vi.fn((data) => ({ success: true, data })),
      optional: vi.fn(() => ({
        parse: vi.fn((data) => data),
        safeParse: vi.fn((data) => ({ success: true, data }))
      }))
    },
    type: {
      CVProfile: {},
      AnalyzeResponse: {}
    }
  }));

  vi.mock("@/lib/apiUtils", () => ({
    createApiErrorResponse: vi.fn((error, status, endpoint) => {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    }),
    createValidationErrorResponse: vi.fn((error, endpoint) => {
      return new Response(JSON.stringify({ error: "Invalid request", details: error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }),
    createSuccessResponse: vi.fn((data) => {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    })
  }));
};

// Extended mock dependencies for job pipeline testing
export const setupJobPipelineMocks = () => {
  vi.mock("@/lib/jobPipeline", () => ({
    analyzeJob: vi.fn().mockResolvedValue({
      id: 123,
      job: { title: "Test Job", company: "Test Company" },
      cv: { roles: [{ title: "Developer", stack: ["React"] }], skills: ["JavaScript"] },
      llmAnalysis: { matchScore: 80, gaps: ["GraphQL"], reasoning: ["Strong React experience"] },
      userInteractions: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    }),
    collectJobLinks: vi.fn().mockResolvedValue({
      jobLinks: [],
      fetchedPages: 0
    }),
    JOB_PIPELINE_DEFAULTS: {
      timeoutMs: 6000,
      retryCount: 1,
      maxSearchPages: 5
    }
  }));
};
