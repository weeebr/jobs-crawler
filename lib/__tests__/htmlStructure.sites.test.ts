import { readFileSync } from "fs";
import { join } from "path";
import { load } from "cheerio";

import { describe, expect, it } from "vitest";

// Test fixtures for different job sites
const fixtures = {
  jobsCh: readFileSync(join(__dirname, "fixtures", "java-fullstack-erp.html"), "utf-8"),
  medtech: readFileSync(join(__dirname, "fixtures", "fullstack-medtech.html"), "utf-8"),
  learning: readFileSync(join(__dirname, "fixtures", "learning-designer-stem.html"), "utf-8"),
};

describe("HTML Structure - Job Sites", () => {
  describe("jobs.ch Structure", () => {
    it("should have jobs.ch specific elements and structure", () => {
      const $ = load(fixtures.jobsCh);
      
      // Check for jobs.ch specific indicators
      const bodyText = $("body").text().toLowerCase();
      const hasJobsChContent = bodyText.includes("jobs.ch") || bodyText.includes("rocken");
      
      // Check for structured data with job posting
      const jsonLdScripts = $('script[type="application/ld+json"]');
      let hasJobPosting = false;
      jsonLdScripts.each((_, script) => {
        const content = $(script).html();
        if (content && content.includes('"@type":"JobPosting"')) {
          hasJobPosting = true;
        }
      });
      
      expect(hasJobsChContent || hasJobPosting).toBe(true);
    });

    it("should have proper jobs.ch metadata structure", () => {
      const $ = load(fixtures.jobsCh);
      
      // Check for jobs.ch specific meta tags
      const ogTitle = $('meta[property="og:title"]');
      const ogUrl = $('meta[property="og:url"]');
      const ogDescription = $('meta[property="og:description"]');
      
      expect(ogTitle.length).toBeGreaterThan(0);
      expect(ogUrl.length).toBeGreaterThan(0);
      expect(ogDescription.length).toBeGreaterThan(0);
      
      // Check that URL is a valid job posting URL
      expect(ogUrl.attr("content")).toContain("vacancies/detail");
    });
  });

  describe("Generic Job Posting Structure", () => {
    it("should have consistent title extraction points", () => {
      Object.entries(fixtures).forEach(([siteName, html]) => {
        const $ = load(html);
        
        // Check multiple title extraction strategies
        const titleSelectors = [
          "h1",
          ".job-title",
          ".position-title",
          "[data-testid*='title']",
          "title"
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
    });

    it("should have consistent company extraction points", () => {
      Object.entries(fixtures).forEach(([siteName, html]) => {
        const $ = load(html);
        
        // Check for company in structured data
        const jsonLdScripts = $('script[type="application/ld+json"]');
        let foundCompany = false;
        
        jsonLdScripts.each((_, script) => {
          const content = $(script).html();
          if (content && (
            content.includes('"hiringOrganization"') ||
            content.includes('"organization"') ||
            content.includes('"name":')
          )) {
            foundCompany = true;
          }
        });
        
        // Also check in meta tags
        const ogDescription = $('meta[property="og:description"]');
        if (ogDescription.length > 0 && ogDescription.attr("content")) {
          foundCompany = true;
        }
        
        expect(foundCompany).toBe(true);
      });
    });
  });

  describe("Critical Selector Validation", () => {
    it("should have selectors that our parsers depend on", () => {
      Object.entries(fixtures).forEach(([siteName, html]) => {
        const $ = load(html);
        
        // Critical selectors that our parsing logic depends on
        const criticalSelectors = [
          "title", // For title extraction
          "meta[property='og:title']", // For title fallback
          "meta[property='og:site_name']", // For company extraction
          "h1, h2, h3", // For content structure
          "p", // For text content
          "ul, ol", // For lists (requirements, benefits)
          "main, .main, .content" // For main content area
        ];
        
        let foundCriticalSelectors = 0;
        criticalSelectors.forEach(selector => {
          if ($(selector).length > 0) {
            foundCriticalSelectors++;
          }
        });
        
        // Should have at least 70% of critical selectors
        expect(foundCriticalSelectors / criticalSelectors.length).toBeGreaterThan(0.7);
      });
    });
  });
});
