import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/analyze/route";

// Mock the critical dependencies
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
    save: vi.fn().mockReturnValue({
      id: 123,
      job: {},
      cv: {},
      llmAnalysis: {},
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

describe("API /analyze - Critical Paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle single job URL analysis successfully", async () => {
    const request = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        jobUrl: "https://example.com/job/123"
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.records).toHaveLength(1);
    expect(data.records[0].id).toBe(123);
  });

  it("should handle raw HTML analysis", async () => {
    const request = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        rawHtml: "<html><h1>Job Title</h1><p>Job description</p></html>"
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.records).toHaveLength(1);
  });

  it("should reject invalid request schemas", async () => {
    const request = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        // Missing required fields
        invalidField: "test"
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request");
    expect(data.details).toBeDefined();
  });

  it("should reject requests with both jobUrl and searchUrl", async () => {
    const request = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        jobUrl: "https://example.com/job/123",
        searchUrl: "https://example.com/search"
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request");
  });

  it("should handle fetch failures gracefully", async () => {
    const { fetchJobAd } = await import("@/lib/fetchJobAd");
    vi.mocked(fetchJobAd).mockRejectedValue(new Error("Network error"));

    const request = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        jobUrl: "https://example.com/job/123"
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Network error");
  });

  it("should handle parsing failures gracefully", async () => {
    const { parseJobAd } = await import("@/lib/parseJobAd");
    vi.mocked(parseJobAd).mockRejectedValue(new Error("Cannot extract job title"));

    const request = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        rawHtml: "<html>Invalid job ad</html>"
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Cannot extract job title");
  });
});
