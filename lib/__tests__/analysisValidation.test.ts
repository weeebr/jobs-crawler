import { describe, expect, it } from "vitest";
import { isAnalysisComplete, filterCompleteAnalyses } from "@/lib/analysisValidation";
import type { AnalysisRecord } from "@/lib/types";

describe("Analysis Validation - Critical Data Integrity", () => {
  const createCompleteAnalysis = (): AnalysisRecord => ({
    id: 123,
    job: {
      title: "Test Job",
      company: "Test Company",
      stack: ["React"],
      qualifications: ["3+ years"],
      roles: ["Developer"],
      benefits: ["Remote"],
      fetchedAt: Date.now(),
      sourceDomain: "example.com"
    },
    cv: {
      roles: [{ title: "Developer", stack: ["React"] }],
      skills: ["JavaScript"],
      projects: [],
      education: [],
      keywords: []
    },
    llmAnalysis: {
      matchScore: 80,
      reasoning: ["Strong React experience"],
      letters: {},
      analyzedAt: Date.now(),
      analysisVersion: "1.0"
    },
    userInteractions: {
      interactionCount: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  it("should validate complete analysis records", () => {
    const complete = createCompleteAnalysis();
    expect(isAnalysisComplete(complete)).toBe(true);
  });

  it("should reject incomplete LLM analysis", () => {
    const incomplete = createCompleteAnalysis();
    incomplete.llmAnalysis.matchScore = -1; // Invalid score
    
    expect(isAnalysisComplete(incomplete)).toBe(false);
  });

  it("should reject missing reasoning", () => {
    const incomplete = createCompleteAnalysis();
    incomplete.llmAnalysis.reasoning = []; // Empty reasoning
    
    expect(isAnalysisComplete(incomplete)).toBe(false);
  });

  it("should reject missing job data", () => {
    const incomplete = createCompleteAnalysis();
    incomplete.job.title = ""; // Empty title
    
    expect(isAnalysisComplete(incomplete)).toBe(false);
  });

  it("should reject missing CV data", () => {
    const incomplete = createCompleteAnalysis();
    incomplete.cv.roles = undefined as any; // Missing roles array
    
    expect(isAnalysisComplete(incomplete)).toBe(false);
  });

  it("should reject invalid match scores", () => {
    // Test too high score
    const invalid1 = createCompleteAnalysis();
    invalid1.llmAnalysis.matchScore = 101;
    expect(isAnalysisComplete(invalid1)).toBe(false);
    
    // Test too low score
    const invalid2 = createCompleteAnalysis();
    invalid2.llmAnalysis.matchScore = -1;
    expect(isAnalysisComplete(invalid2)).toBe(false);
    
    // Test NaN score
    const invalid3 = createCompleteAnalysis();
    invalid3.llmAnalysis.matchScore = NaN;
    expect(isAnalysisComplete(invalid3)).toBe(false);
  });

  it("should filter complete analyses from mixed list", () => {
    const complete1 = createCompleteAnalysis();
    const complete2 = createCompleteAnalysis();
    complete2.id = 456;
    
    const incomplete = createCompleteAnalysis();
    incomplete.id = 789;
    incomplete.llmAnalysis.reasoning = []; // Make incomplete
    
    const mixed = [complete1, incomplete, complete2];
    const filtered = filterCompleteAnalyses(mixed);
    
    expect(filtered).toHaveLength(2);
    expect(filtered.map(a => a.id)).toEqual([123, 456]); // Should maintain order
  });

  it("should handle empty analysis list", () => {
    const filtered = filterCompleteAnalyses([]);
    expect(filtered).toHaveLength(0);
  });

  it("should reject analyses with missing timestamps", () => {
    const incomplete = createCompleteAnalysis();
    incomplete.llmAnalysis.analyzedAt = 0; // Invalid timestamp
    
    expect(isAnalysisComplete(incomplete)).toBe(false);
  });
});
