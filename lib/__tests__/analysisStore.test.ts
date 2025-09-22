import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  saveAnalysis,
  getAnalysis,
  listAnalyses,
  deleteAnalysis,
  clearAllAnalyses
} from "@/lib/analysisStore";
import type { AnalysisRecord, LegacyAnalysisRecord } from "@/lib/types";

describe("Analysis Store - Critical Data Operations", () => {
  beforeEach(() => {
    clearAllAnalyses();
  });

  afterEach(() => {
    clearAllAnalyses();
  });

  const createMockAnalysis = (id: number): AnalysisRecord => ({
    id,
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

  it("should save and retrieve analysis records", () => {
    const analysis = createMockAnalysis(123);
    const saved = saveAnalysis(analysis);
    
    expect(saved.id).toBe(123);
    
    const retrieved = getAnalysis(123);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(123);
    expect(retrieved?.job.title).toBe("Test Job");
  });

  it("should handle legacy record format conversion", () => {
    const legacyRecord: LegacyAnalysisRecord = {
      id: 456,
      job: {
        title: "Legacy Job",
        company: "Legacy Company",
        stack: ["Vue"],
        qualifications: [],
        roles: [],
        benefits: [],
        fetchedAt: Date.now()
      },
      cv: {
        roles: [],
        skills: [],
        projects: [],
        education: [],
        keywords: []
      },
      analysis: {
        matchScore: 70,
        reasoning: ["Legacy analysis"],
        letters: {},
        analyzedAt: Date.now(),
        analysisVersion: "1.0",
        interactionCount: 0,
        status: "interested",
        notes: "Test note"
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const saved = saveAnalysis(legacyRecord);
    
    expect(saved.id).toBe(456);
    expect(saved.llmAnalysis).toBeDefined();
    expect(saved.userInteractions).toBeDefined();
    expect(saved.userInteractions.status).toBe("interested");
    expect(saved.userInteractions.notes).toBe("Test note");
  });

  it("should list analyses in correct order (newest first)", () => {
    const now = Date.now();
    const analysis1 = createMockAnalysis(1);
    analysis1.createdAt = now - 2000; // 2 seconds ago
    const analysis2 = createMockAnalysis(2);
    analysis2.createdAt = now; // Most recent
    const analysis3 = createMockAnalysis(3);
    analysis3.createdAt = now - 1000; // 1 second ago
    
    // Save in different order
    saveAnalysis(analysis1);
    saveAnalysis(analysis3);
    saveAnalysis(analysis2);
    
    const analyses = listAnalyses(10);
    expect(analyses).toHaveLength(3);
    // The order should be by creation time, with most recent first
    expect(analyses[0].id).toBe(2); // Most recent
    expect(analyses[1].id).toBe(3);
    expect(analyses[2].id).toBe(1); // Oldest
  });

  it("should limit list results correctly", () => {
    const now = Date.now();
    // Create 5 analyses with different timestamps
    for (let i = 1; i <= 5; i++) {
      const analysis = createMockAnalysis(i);
      analysis.createdAt = now - (5 - i) * 1000; // Each 1 second apart
      saveAnalysis(analysis);
    }
    
    const limited = listAnalyses(3);
    expect(limited).toHaveLength(3);
    expect(limited[0].id).toBe(5); // Most recent
  });

  it("should delete analysis records", () => {
    const analysis = createMockAnalysis(789);
    saveAnalysis(analysis);
    
    expect(getAnalysis(789)).toBeDefined();
    
    const deleted = deleteAnalysis(789);
    expect(deleted).toBe(true);
    expect(getAnalysis(789)).toBeUndefined();
  });

  it("should handle deletion of non-existent records", () => {
    const deleted = deleteAnalysis(999);
    expect(deleted).toBe(false);
  });

  it("should clear all analyses", () => {
    saveAnalysis(createMockAnalysis(1));
    saveAnalysis(createMockAnalysis(2));
    
    expect(listAnalyses()).toHaveLength(2);
    
    clearAllAnalyses();
    expect(listAnalyses()).toHaveLength(0);
  });

  it("should validate data schemas on save", () => {
    const invalidRecord = {
      id: 999,
      job: {
        title: "", // Invalid: empty title
        company: "Test Company",
        stack: [],
        qualifications: [],
        roles: [],
        benefits: [],
        fetchedAt: Date.now()
      },
      cv: {
        roles: [],
        skills: [],
        projects: [],
        education: [],
        keywords: []
      },
      llmAnalysis: {
        matchScore: 80,
        reasoning: [],
        letters: {},
        analyzedAt: Date.now(),
        analysisVersion: "1.0"
      },
      userInteractions: {
        interactionCount: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    expect(() => saveAnalysis(invalidRecord as any)).toThrow();
  });
});
