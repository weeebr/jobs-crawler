import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "vitest";

import { 
  validateHTMLStructure, 
  compareHTMLStructures, 
  generateStructureSnapshot
} from "./htmlStructureUtils";

// Test fixtures
const fixturePath = join(__dirname, "fixtures", "java-fullstack-erp.html");
const SAMPLE_HTML = readFileSync(fixturePath, "utf-8");

describe("HTML Structure Utils", () => {
  describe("Structure Validation", () => {
    it("should validate HTML structure and return comprehensive report", () => {
      const report = validateHTMLStructure(SAMPLE_HTML);
      
      // Should be valid
      expect(report.isValid).toBe(true);
      expect(report.issues).toHaveLength(0);
      
      // Should have all critical selectors
      expect(report.criticalSelectors.title).toBe(true);
      expect(report.criticalSelectors.ogTitle).toBe(true);
      expect(report.criticalSelectors.ogUrl).toBe(true);
      expect(report.criticalSelectors.ogDescription).toBe(true);
      expect(report.criticalSelectors.mainContent).toBe(true);
      expect(report.criticalSelectors.headings).toBe(true);
      expect(report.criticalSelectors.paragraphs).toBe(true);
      expect(report.criticalSelectors.structuredData).toBe(true);
    });

    it("should detect structural issues in malformed HTML", () => {
      const malformedHTML = `
        <html>
          <head>
            <title>Test</title>
          </head>
          <body>
            <p>Short content</p>
          </body>
        </html>
      `;
      
      const report = validateHTMLStructure(malformedHTML);
      
      // Should not be valid
      expect(report.isValid).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
      
      // Should have specific issues
      expect(report.issues).toContain("Missing OpenGraph title");
      expect(report.issues).toContain("Missing OpenGraph URL");
      expect(report.issues).toContain("Missing structured data");
    });
  });

  describe("Structure Comparison", () => {
    it("should compare HTML structures and detect changes", () => {
      const baselineReport = validateHTMLStructure(SAMPLE_HTML);
      
      // Create a modified version with some changes
      const modifiedHTML = SAMPLE_HTML.replace(
        'Java Fullstack Developer',
        'Modified Title'
      );
      const currentReport = validateHTMLStructure(modifiedHTML);
      
      const comparison = compareHTMLStructures(baselineReport, currentReport);
      
      // Should detect changes
      expect(comparison.hasChanges).toBe(true);
      expect(comparison.warnings.length).toBeGreaterThan(0);
      expect(comparison.warnings.some(w => w.includes("Title changed"))).toBe(true);
    });
  });

  describe("Snapshot Generation", () => {
    it("should generate a structure snapshot", () => {
      const snapshot = generateStructureSnapshot(SAMPLE_HTML);
      
      expect(snapshot).toBeTruthy();
      
      const parsed = JSON.parse(snapshot);
      expect(parsed.timestamp).toBeTruthy();
      expect(parsed.report).toBeTruthy();
      expect(parsed.snapshot).toBeTruthy();
      
      // Should contain all required fields
      expect(parsed.snapshot.criticalSelectors).toBeTruthy();
      expect(parsed.snapshot.contentMetrics).toBeTruthy();
      expect(parsed.snapshot.metadata).toBeTruthy();
    });
  });
});
