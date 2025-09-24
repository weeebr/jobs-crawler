import type { CVProfile } from "@/lib/schemas";

// Valid test data that passes Zod validation
export const createValidJobUrlRequest = () => ({
  jobUrl: "https://example.com/job/123"
});

export const createValidRawHtmlRequest = () => ({
  rawHtml: `<html>
<head><title>Senior Frontend Developer</title></head>
<body>
  <h1>Senior Frontend Developer</h1>
  <p>We are looking for an experienced Frontend Developer to join our team.</p>
  <ul>
    <li>React 3+ years</li>
    <li>TypeScript</li>
    <li>Node.js experience</li>
  </ul>
</body>
</html>`
});

export const createValidSearchUrlRequest = () => ({
  searchUrl: "https://example.com/jobs?query=frontend+developer"
});

export const createValidCVProfile = (): CVProfile => ({
  roles: [
    {
      title: "Software Engineer",
      stack: ["TypeScript", "React", "Node.js"],
      years: 3
    }
  ],
  skills: ["JavaScript", "Python", "AWS"],
  projects: [
    {
      name: "E-commerce Platform",
      impact: "Increased conversion by 25%",
      stack: ["React", "Node.js", "PostgreSQL"]
    }
  ],
  education: [
    {
      degree: "Bachelor of Computer Science",
      institution: "University of Example"
    }
  ],
  keywords: ["full-stack", "agile", "microservices"]
});

export const createInvalidRequestWithInvalidField = () => ({
  invalidField: "test",
  jobUrl: "https://example.com/job/123"
});

export const createConflictingRequest = () => ({
  jobUrl: "https://example.com/job/123",
  searchUrl: "https://example.com/search"
});

// Request with valid structure but empty required fields
export const createEmptyRawHtmlRequest = () => ({
  rawHtml: ""
});

export const createInvalidUrlRequest = () => ({
  jobUrl: "not-a-valid-url"
});

export const createRequestWithInvalidCV = () => ({
  jobUrl: "https://example.com/job/123",
  cv: {
    roles: [], // Invalid: roles should not be empty
    skills: [],
    projects: [],
    education: [],
    keywords: []
  }
});

export const createRequestWithEmptyJobTitle = () => ({
  jobUrl: "https://example.com/job/123",
  cv: {
    ...createValidCVProfile(),
    roles: [{
      title: "", // Invalid: empty job title
      stack: ["React"],
      years: 3
    }]
  }
});
