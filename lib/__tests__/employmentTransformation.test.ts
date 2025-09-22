import { describe, expect, it } from "vitest";
import { load } from "cheerio";

import { extractDuration } from "../jobAd/metadata/workload";
import { extractEnhancedMetadata } from "../jobAd/metadata/structuredExtractor";

describe("Employment Type Transformation", () => {
  it("should transform 'Unlimited employment' to 'Unlimited'", async () => {
    const html = `
      <html>
        <head><title>Software Engineer - TechCorp</title></head>
        <body>
          <h1>Software Engineer</h1>
          <div class="company">TechCorp</div>
          <div class="job-meta">
            <p>Contract type: Unlimited employment</p>
            <p>Location: Zurich, Switzerland</p>
          </div>
          <div class="job-description">
            <h2>Requirements</h2>
            <ul><li>React experience</li></ul>
          </div>
        </body>
      </html>
    `;
    
    const $ = load(html);
    const text = $.text();
    
    // Test structured extraction
    const structured = extractEnhancedMetadata($, html, text);
    console.log("Structured duration:", structured.duration);
    
    // Test individual extraction
    const duration = extractDuration($, text);
    console.log("Individual duration:", duration);
    
    // Should transform "Unlimited employment" to "Unlimited"
    expect(duration).toBe("Unlimited");
  });

  it("should transform 'Permanent employment' to 'Permanent'", async () => {
    const html = `
      <html>
        <head><title>Software Engineer - TechCorp</title></head>
        <body>
          <h1>Software Engineer</h1>
          <div class="company">TechCorp</div>
          <div class="job-meta">
            <p>Contract type: Permanent employment</p>
            <p>Location: Zurich, Switzerland</p>
          </div>
          <div class="job-description">
            <h2>Requirements</h2>
            <ul><li>React experience</li></ul>
          </div>
        </body>
      </html>
    `;
    
    const $ = load(html);
    const text = $.text();
    
    const duration = extractDuration($, text);
    console.log("Permanent duration:", duration);
    
    // Should transform "Permanent employment" to "Permanent"
    expect(duration).toBe("Permanent");
  });

  it("should handle various employment type formats", async () => {
    const testCases = [
      { input: "Unlimited employment", expected: "Unlimited" },
      { input: "Permanent employment", expected: "Permanent" },
      { input: "Temporary employment", expected: "Temporary" },
      { input: "Fixed-term employment", expected: "Fixed-term" },
      { input: "Part-time employment", expected: "Part-time" },
      { input: "Full-time employment", expected: "Full-time" },
      { input: "Unlimited", expected: "Unlimited" },
      { input: "Permanent", expected: "Permanent" },
    ];

    for (const testCase of testCases) {
      const html = `
        <html>
          <head><title>Software Engineer - TechCorp</title></head>
          <body>
            <h1>Software Engineer</h1>
            <div class="company">TechCorp</div>
            <div class="job-meta">
              <p>Contract type: ${testCase.input}</p>
            </div>
            <div class="job-description">
              <h2>Requirements</h2>
              <ul><li>React experience</li></ul>
            </div>
          </body>
        </html>
      `;
      
      const $ = load(html);
      const text = $.text();
      
      const duration = extractDuration($, text);
      console.log(`Input: "${testCase.input}" -> Output: "${duration}" (Expected: "${testCase.expected}")`);
      
      expect(duration).toBe(testCase.expected);
    }
  });

  it("should handle employment types in different contexts", async () => {
    const html = `
      <html>
        <head><title>Software Engineer - TechCorp</title></head>
        <body>
          <h1>Software Engineer</h1>
          <div class="company">TechCorp</div>
          <div class="job-description">
            <h2>Job Details</h2>
            <p>We offer unlimited employment with competitive benefits.</p>
            <p>This is a permanent position in our development team.</p>
            <h2>Requirements</h2>
            <ul><li>React experience</li></ul>
          </div>
        </body>
      </html>
    `;
    
    const $ = load(html);
    const text = $.text();
    
    const duration = extractDuration($, text);
    console.log("Context duration:", duration);
    
    // Should extract and transform the employment type
    expect(duration).toBeDefined();
    if (duration) {
      expect(typeof duration).toBe("string");
      expect(duration.length).toBeGreaterThan(0);
    }
  });

  it("should filter out empty employment values", async () => {
    const html = `
      <html>
        <head><title>Software Engineer - TechCorp</title></head>
        <body>
          <h1>Software Engineer</h1>
          <div class="company">TechCorp</div>
          <div class="job-meta">
            <p>Contract type: ,</p>
            <p>Contract type: </p>
            <p>Contract type:   </p>
          </div>
          <div class="job-description">
            <h2>Requirements</h2>
            <ul><li>React experience</li></ul>
          </div>
        </body>
      </html>
    `;
    
    const $ = load(html);
    const text = $.text();
    
    const duration = extractDuration($, text);
    console.log("Empty duration:", duration);
    
    // Should filter out empty employment values
    expect(duration).toBeUndefined();
  });
});
