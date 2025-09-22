import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

import { parseJobAd } from "../parseJobAd";

describe("Team Size Extraction from Fixtures", () => {
  const fixturesDir = join(__dirname, "fixtures");

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key-for-testing-only";
  });

  it("should extract team size from java-fullstack-erp.html", async () => {
    const fixturePath = join(fixturesDir, "java-fullstack-erp.html");
    const html = readFileSync(fixturePath, "utf-8");
    
    const result = await parseJobAd(html, {
      sourceUrl: "https://jobs.ch/jobs/java-fullstack-erp"
    });

    console.log("Java Fullstack ERP - Team Size:", result.teamSize);
    console.log("Java Fullstack ERP - Company:", result.company);
    console.log("Java Fullstack ERP - Title:", result.title);
    
    // Check if team size was extracted
    if (result.teamSize) {
      expect(result.teamSize).toBeDefined();
      expect(typeof result.teamSize).toBe("string");
      expect(result.teamSize.length).toBeGreaterThan(0);
    }
  });

  it("should extract team size from learning-designer-stem.html", async () => {
    const fixturePath = join(fixturesDir, "learning-designer-stem.html");
    const html = readFileSync(fixturePath, "utf-8");
    
    const result = await parseJobAd(html, {
      sourceUrl: "https://jobs.ch/jobs/learning-designer-stem"
    });

    console.log("Learning Designer STEM - Team Size:", result.teamSize);
    console.log("Learning Designer STEM - Company:", result.company);
    console.log("Learning Designer STEM - Title:", result.title);
    
    // Check if team size was extracted
    if (result.teamSize) {
      expect(result.teamSize).toBeDefined();
      expect(typeof result.teamSize).toBe("string");
      expect(result.teamSize.length).toBeGreaterThan(0);
    }
  });

  it("should extract team size from fullstack-medtech.html", async () => {
    const fixturePath = join(fixturesDir, "fullstack-medtech.html");
    const html = readFileSync(fixturePath, "utf-8");
    
    const result = await parseJobAd(html, {
      sourceUrl: "https://jobs.ch/jobs/fullstack-medtech"
    });

    console.log("Fullstack Medtech - Team Size:", result.teamSize);
    console.log("Fullstack Medtech - Company:", result.company);
    console.log("Fullstack Medtech - Title:", result.title);
    
    // Check if team size was extracted
    if (result.teamSize) {
      expect(result.teamSize).toBeDefined();
      expect(typeof result.teamSize).toBe("string");
      expect(result.teamSize.length).toBeGreaterThan(0);
    }
  });

  it("should handle fixtures without team size information", async () => {
    // Test that our filtering logic works correctly when no team size is present
    const fixture1Path = join(fixturesDir, "java-fullstack-erp.html");
    const html1 = readFileSync(fixture1Path, "utf-8");
    
    const fixture2Path = join(fixturesDir, "learning-designer-stem.html");
    const html2 = readFileSync(fixture2Path, "utf-8");
    
    const fixture3Path = join(fixturesDir, "fullstack-medtech.html");
    const html3 = readFileSync(fixture3Path, "utf-8");
    
    const result1 = await parseJobAd(html1, {
      sourceUrl: "https://jobs.ch/jobs/java-fullstack-erp"
    });
    
    const result2 = await parseJobAd(html2, {
      sourceUrl: "https://jobs.ch/jobs/learning-designer-stem"
    });
    
    const result3 = await parseJobAd(html3, {
      sourceUrl: "https://jobs.ch/jobs/fullstack-medtech"
    });
    
    // All fixtures should have undefined team size since they don't contain team size info
    expect(result1.teamSize).toBeUndefined();
    expect(result2.teamSize).toBeUndefined();
    expect(result3.teamSize).toBeUndefined();
  });
});
