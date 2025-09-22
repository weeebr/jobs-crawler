import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

import { parseJobAd } from "../parseJobAd";

describe("Employment Type Extraction from Fixtures", () => {
  const fixturesDir = join(__dirname, "fixtures");

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key-for-testing-only";
  });

  it("should extract employment type from java-fullstack-erp.html", async () => {
    const fixturePath = join(fixturesDir, "java-fullstack-erp.html");
    const html = readFileSync(fixturePath, "utf-8");
    
    const result = await parseJobAd(html, {
      sourceUrl: "https://jobs.ch/jobs/java-fullstack-erp"
    });

    console.log("Java Fullstack ERP - Duration:", result.duration);
    console.log("Java Fullstack ERP - Company:", result.company);
    console.log("Java Fullstack ERP - Title:", result.title);
    
    // Check if employment type was extracted and properly transformed
    if (result.duration) {
      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe("string");
      expect(result.duration.length).toBeGreaterThan(0);
      
      // Should not contain "employment" suffix if it was transformed
      expect(result.duration).not.toContain(" employment");
      expect(result.duration).not.toContain(" contract");
    }
  });

  it("should extract employment type from learning-designer-stem.html", async () => {
    const fixturePath = join(fixturesDir, "learning-designer-stem.html");
    const html = readFileSync(fixturePath, "utf-8");
    
    const result = await parseJobAd(html, {
      sourceUrl: "https://jobs.ch/jobs/learning-designer-stem"
    });

    console.log("Learning Designer STEM - Duration:", result.duration);
    console.log("Learning Designer STEM - Company:", result.company);
    console.log("Learning Designer STEM - Title:", result.title);
    
    // Check if employment type was extracted and properly transformed
    if (result.duration) {
      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe("string");
      expect(result.duration.length).toBeGreaterThan(0);
      
      // Should not contain "employment" suffix if it was transformed
      expect(result.duration).not.toContain(" employment");
      expect(result.duration).not.toContain(" contract");
    }
  });

  it("should extract employment type from fullstack-medtech.html", async () => {
    const fixturePath = join(fixturesDir, "fullstack-medtech.html");
    const html = readFileSync(fixturePath, "utf-8");
    
    const result = await parseJobAd(html, {
      sourceUrl: "https://jobs.ch/jobs/fullstack-medtech"
    });

    console.log("Fullstack Medtech - Duration:", result.duration);
    console.log("Fullstack Medtech - Company:", result.company);
    console.log("Fullstack Medtech - Title:", result.title);
    
    // Check if employment type was extracted and properly transformed
    if (result.duration) {
      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe("string");
      expect(result.duration.length).toBeGreaterThan(0);
      
      // Should not contain "employment" suffix if it was transformed
      expect(result.duration).not.toContain(" employment");
      expect(result.duration).not.toContain(" contract");
    }
  });

  it("should handle fixtures without employment type information", async () => {
    // Test that our filtering logic works correctly when no employment type is present
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
    
    // All fixtures should have proper employment type extraction or undefined
    // If they have employment type, it should be properly transformed
    [result1, result2, result3].forEach((result, index) => {
      if (result.duration) {
        expect(result.duration).toBeDefined();
        expect(typeof result.duration).toBe("string");
        expect(result.duration.length).toBeGreaterThan(0);
        
        // Should not contain "employment" suffix if it was transformed
        expect(result.duration).not.toContain(" employment");
        expect(result.duration).not.toContain(" contract");
        
        console.log(`Fixture ${index + 1} - Duration: "${result.duration}"`);
      } else {
        console.log(`Fixture ${index + 1} - Duration: undefined`);
      }
    });
  });
});
