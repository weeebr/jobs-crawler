import { readFileSync } from "fs";
import { join } from "path";
import { load } from "cheerio";

import { describe, expect, it } from "vitest";

// Test fixtures
const fixturePath = join(__dirname, "fixtures", "java-fullstack-erp.html");
const SAMPLE_HTML = readFileSync(fixturePath, "utf-8");

describe("HTML Structure - Metadata Validation", () => {
  describe("Location Information", () => {
    it("should have location information", () => {
      const $ = load(SAMPLE_HTML);
      
      // Look for location in various formats
      const locationIndicators = [
        "location",
        "place",
        "address", 
        "city",
        "region",
        "country"
      ];
      
      let foundLocation = false;
      locationIndicators.forEach(indicator => {
        // Check for data attributes, classes, or text content
        const elements = $(`[data-*="${indicator}"], .${indicator}, [class*="${indicator}"]`);
        if (elements.length > 0 && elements.text().trim().length > 0) {
          foundLocation = true;
        }
      });
      
      // Also check for location in structured data
      const jsonLdScripts = $('script[type="application/ld+json"]');
      jsonLdScripts.each((_, script) => {
        const content = $(script).html();
        if (content && (content.includes('"address"') || content.includes('"location"'))) {
          foundLocation = true;
        }
      });
      
      expect(foundLocation).toBe(true);
    });
  });

  describe("Employment Information", () => {
    it("should have employment type information", () => {
      const $ = load(SAMPLE_HTML);
      
      // Look for employment type indicators
      const employmentIndicators = [
        "full-time",
        "part-time", 
        "contract",
        "permanent",
        "temporary",
        "freelance"
      ];
      
      const bodyText = $("body").text().toLowerCase();
      let foundEmploymentType = false;
      
      employmentIndicators.forEach(indicator => {
        if (bodyText.includes(indicator)) {
          foundEmploymentType = true;
        }
      });
      
      expect(foundEmploymentType).toBe(true);
    });

    it("should have salary or compensation information", () => {
      const $ = load(SAMPLE_HTML);
      
      // Look for salary indicators
      const salaryIndicators = [
        "salary",
        "wage",
        "compensation",
        "pay",
        "rate",
        "budget"
      ];
      
      const bodyText = $("body").text().toLowerCase();
      let foundSalary = false;
      
      salaryIndicators.forEach(indicator => {
        if (bodyText.includes(indicator)) {
          foundSalary = true;
        }
      });
      
      // Also check structured data
      const jsonLdScripts = $('script[type="application/ld+json"]');
      jsonLdScripts.each((_, script) => {
        const content = $(script).html();
        if (content && (content.includes('"salary"') || content.includes('"baseSalary"'))) {
          foundSalary = true;
        }
      });
      
      expect(foundSalary).toBe(true);
    });
  });

  describe("Content Quality", () => {
    it("should have substantial text content", () => {
      const $ = load(SAMPLE_HTML);
      
      const bodyText = $("body").text().trim();
      expect(bodyText.length).toBeGreaterThan(500);
      
      // Should not be mostly whitespace
      const nonWhitespaceLength = bodyText.replace(/\s+/g, "").length;
      expect(nonWhitespaceLength).toBeGreaterThan(200);
    });

    it("should have proper paragraph structure", () => {
      const $ = load(SAMPLE_HTML);
      
      const paragraphs = $("p");
      expect(paragraphs.length).toBeGreaterThan(0);
      
      // Check that paragraphs have content
      let paragraphsWithContent = 0;
      paragraphs.each((_, p) => {
        if ($(p).text().trim().length > 10) {
          paragraphsWithContent++;
        }
      });
      
      expect(paragraphsWithContent).toBeGreaterThan(0);
    });

    it("should have list structures for requirements or benefits", () => {
      const $ = load(SAMPLE_HTML);
      
      const lists = $("ul, ol");
      expect(lists.length).toBeGreaterThan(0);
      
      // Check that lists have items
      let listsWithItems = 0;
      lists.each((_, list) => {
        if ($(list).find("li").length > 0) {
          listsWithItems++;
        }
      });
      
      expect(listsWithItems).toBeGreaterThan(0);
    });
  });
});
