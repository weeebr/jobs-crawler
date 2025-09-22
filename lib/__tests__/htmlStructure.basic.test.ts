import { readFileSync } from "fs";
import { join } from "path";
import { load } from "cheerio";

import { describe, expect, it } from "vitest";

// Test fixtures
const fixturePath = join(__dirname, "fixtures", "java-fullstack-erp.html");
const SAMPLE_HTML = readFileSync(fixturePath, "utf-8");

describe("HTML Structure - Basic Validation", () => {
  describe("Critical HTML Elements", () => {
    it("should have valid HTML structure with required elements", () => {
      const $ = load(SAMPLE_HTML);
      
      // Basic HTML structure
      expect($("html").length).toBe(1);
      expect($("head").length).toBe(1);
      expect($("body").length).toBe(1);
      
      // Title element
      expect($("title").length).toBeGreaterThan(0);
      expect($("title").text().trim()).toBeTruthy();
    });

    it("should have proper meta tags for job posting identification", () => {
      const $ = load(SAMPLE_HTML);
      
      // OpenGraph meta tags
      const ogTitle = $('meta[property="og:title"]');
      const ogUrl = $('meta[property="og:url"]');
      const ogDescription = $('meta[property="og:description"]');
      
      expect(ogTitle.length).toBeGreaterThan(0);
      expect(ogUrl.length).toBeGreaterThan(0);
      expect(ogDescription.length).toBeGreaterThan(0);
      
      // Verify content is not empty
      expect(ogTitle.attr("content")).toBeTruthy();
      expect(ogUrl.attr("content")).toBeTruthy();
      expect(ogDescription.attr("content")).toBeTruthy();
    });

    it("should have structured data for job posting", () => {
      const $ = load(SAMPLE_HTML);
      
      // Look for JSON-LD structured data
      const jsonLdScripts = $('script[type="application/ld+json"]');
      expect(jsonLdScripts.length).toBeGreaterThan(0);
      
      // Verify at least one contains job posting data
      let hasJobPosting = false;
      jsonLdScripts.each((_, script) => {
        const content = $(script).html();
        if (content && (content.includes('"@type":"JobPosting"') || content.includes('"@type": "JobPosting"'))) {
          hasJobPosting = true;
        }
      });
      expect(hasJobPosting).toBe(true);
    });
  });

  describe("Content Structure", () => {
    it("should have main content area with job details", () => {
      const $ = load(SAMPLE_HTML);
      
      // Look for main content containers
      const mainContent = $("main, .main, .content, .job-content, .job-details");
      expect(mainContent.length).toBeGreaterThan(0);
      
      // Verify main content has substantial text
      const mainText = mainContent.text().trim();
      expect(mainText.length).toBeGreaterThan(100);
    });

    it("should have job title in heading elements", () => {
      const $ = load(SAMPLE_HTML);
      
      // Look for job title in various heading elements
      const titleSelectors = [
        "h1",
        ".job-title",
        ".position-title", 
        "[data-testid*='title']",
        ".title"
      ];
      
      let foundTitle = false;
      titleSelectors.forEach(selector => {
        const elements = $(selector);
        if (elements.length > 0 && elements.text().trim().length > 0) {
          foundTitle = true;
        }
      });
      
      expect(foundTitle).toBe(true);
    });

    it("should have company information", () => {
      const $ = load(SAMPLE_HTML);
      
      // Look for company name in structured data
      const jsonLdScripts = $('script[type="application/ld+json"]');
      let foundCompany = false;
      
      jsonLdScripts.each((_, script) => {
        const content = $(script).html();
        if (content && (
          content.includes('"hiringOrganization"') ||
          content.includes('"organization"') ||
          content.includes('"name":"Rocken"')
        )) {
          foundCompany = true;
        }
      });
      
      expect(foundCompany).toBe(true);
    });
  });
});
