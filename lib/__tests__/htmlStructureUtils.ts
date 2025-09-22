import { load } from "cheerio";

export interface HTMLStructureReport {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  criticalSelectors: Record<string, boolean>;
  contentMetrics: { bodyTextLength: number; mainContentLength: number; paragraphCount: number; listCount: number; headingCount: number; };
  metadata: { title: string; company: string; ogTitle: string; ogSiteName: string; structuredDataCount: number; };
}

export function validateHTMLStructure(html: string): HTMLStructureReport {
  const $ = load(html);
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Critical selectors that must be present
  const criticalSelectors = {
    title: $("title").length > 0,
    ogTitle: $('meta[property="og:title"]').length > 0,
    ogUrl: $('meta[property="og:url"]').length > 0,
    ogDescription: $('meta[property="og:description"]').length > 0,
    mainContent: $("main, .main, .content, .job-content").length > 0,
    headings: $("h1, h2, h3").length > 0,
    paragraphs: $("p").length > 0,
    structuredData: $('script[type="application/ld+json"]').length > 0
  };
  
  // Check for critical issues
  validateCriticalSelectors(criticalSelectors, issues);
  
  // Content metrics
  const contentMetrics = getContentMetrics($);
  validateContentMetrics(contentMetrics, issues, warnings);
  
  // Metadata extraction
  const metadata = getMetadata($);
  validateMetadata(metadata, issues, warnings);
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    criticalSelectors,
    contentMetrics,
    metadata
  };
}

function validateCriticalSelectors(selectors: Record<string, boolean>, issues: string[]): void {
  if (!selectors.title) issues.push("Missing title element");
  if (!selectors.ogTitle) issues.push("Missing OpenGraph title");
  if (!selectors.ogUrl) issues.push("Missing OpenGraph URL");
  if (!selectors.ogDescription) issues.push("Missing OpenGraph description");
  if (!selectors.mainContent) issues.push("Missing main content area");
  if (!selectors.headings) issues.push("Missing heading structure");
  if (!selectors.paragraphs) issues.push("Missing paragraph content");
  if (!selectors.structuredData) issues.push("Missing structured data");
}

function getContentMetrics($: any) {
  const bodyText = $("body").text().trim();
  const mainContent = $("main, .main, .content, .job-content").text().trim();
  const paragraphs = $("p");
  const lists = $("ul, ol");
  const headings = $("h1, h2, h3, h4, h5, h6");
  
  return {
    bodyTextLength: bodyText.length,
    mainContentLength: mainContent.length,
    paragraphCount: paragraphs.length,
    listCount: lists.length,
    headingCount: headings.length
  };
}

function validateContentMetrics(metrics: any, issues: string[], warnings: string[]): void {
  if (metrics.bodyTextLength < 200) {
    issues.push("Insufficient body content");
  } else if (metrics.bodyTextLength < 500) {
    warnings.push("Low body content length");
  }
  
  if (metrics.mainContentLength < 100) {
    issues.push("Insufficient main content");
  } else if (metrics.mainContentLength < 300) {
    warnings.push("Low main content length");
  }
  
  if (metrics.paragraphCount < 2) warnings.push("Low paragraph count");
  if (metrics.listCount === 0) warnings.push("No list structures found");
  if (metrics.headingCount === 0) issues.push("No headings found");
}

function getMetadata($: any) {
  const title = $("title").text().trim();
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  const ogDescription = $('meta[property="og:description"]').attr("content") || "";
  
  // Extract company from structured data
  let company = "Unknown";
  const jsonLdScripts = $('script[type="application/ld+json"]');
  jsonLdScripts.each((_, script) => {
    const content = $(script).html();
    if (content && content.includes('"hiringOrganization"')) {
      const match = content.match(/"name":"([^"]+)"/);
      if (match) {
        company = match[1];
      }
    }
  });
  
  return {
    title: title || ogTitle || "Unknown",
    company,
    ogTitle,
    ogSiteName: company, // Use company as site name
    structuredDataCount: jsonLdScripts.length
  };
}

function validateMetadata(metadata: any, issues: string[], warnings: string[]): void {
  if (!metadata.title || metadata.title === "Unknown") {
    issues.push("No valid title found");
  }
  if (!metadata.company || metadata.company === "Unknown") {
    issues.push("No valid company found");
  }
  if (!metadata.ogTitle) warnings.push("Missing OpenGraph title");
  if (!metadata.ogSiteName) warnings.push("Missing OpenGraph site name");
  if (metadata.structuredDataCount === 0) warnings.push("No structured data found");
}

export function compareHTMLStructures(baseline: HTMLStructureReport, current: HTMLStructureReport): {
  hasChanges: boolean;
  criticalChanges: string[];
  warnings: string[];
} {
  const criticalChanges: string[] = [];
  const warnings: string[] = [];
  
  // Compare critical selectors
  Object.entries(baseline.criticalSelectors).forEach(([selector, wasPresent]) => {
    const isPresent = current.criticalSelectors[selector];
    if (wasPresent && !isPresent) {
      criticalChanges.push(`Critical selector '${selector}' is now missing`);
    } else if (!wasPresent && isPresent) {
      warnings.push(`New critical selector '${selector}' found`);
    }
  });
  
  // Compare content metrics
  const contentThresholds = {
    bodyTextLength: 0.8, // 80% of baseline
    mainContentLength: 0.8,
    paragraphCount: 0.5,
    listCount: 0.5,
    headingCount: 0.5
  };
  
  Object.entries(contentThresholds).forEach(([metric, threshold]) => {
    const baselineValue = baseline.contentMetrics[metric as keyof typeof baseline.contentMetrics];
    const currentValue = current.contentMetrics[metric as keyof typeof current.contentMetrics];
    
    if (currentValue < baselineValue * threshold) {
      criticalChanges.push(`Content metric '${metric}' significantly decreased (${currentValue} vs ${baselineValue})`);
    }
  });
  
  // Compare metadata
  if (baseline.metadata.title !== current.metadata.title) {
    warnings.push(`Title changed from '${baseline.metadata.title}' to '${current.metadata.title}'`);
  }
  
  if (baseline.metadata.company !== current.metadata.company) {
    warnings.push(`Company changed from '${baseline.metadata.company}' to '${current.metadata.company}'`);
  }
  
  return {
    hasChanges: criticalChanges.length > 0 || warnings.length > 0,
    criticalChanges,
    warnings
  };
}

export function generateStructureSnapshot(html: string): string {
  const report = validateHTMLStructure(html);
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    report,
    snapshot: {
      criticalSelectors: report.criticalSelectors,
      contentMetrics: report.contentMetrics,
      metadata: report.metadata
    }
  }, null, 2);
}
