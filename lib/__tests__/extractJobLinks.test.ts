import { describe, expect, it } from "vitest";

import { extractJobLinks } from "../extractJobLinks";

describe("extractJobLinks", () => {
  it("returns all matching links as absolutes", () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Job Search Results</title>
      </head>
      <body>
          <main>
              <h1>Job Search Results</h1>
              
              <div class="search-results">
                  <div class="job-listing">
                      <h2><a href="/en/vacancies/detail/first-job">Frontend Developer</a></h2>
                      <p>Company: TechCorp</p>
                      <p>Location: Zurich</p>
                  </div>
                  
                  <div class="job-listing">
                      <h2><a href="/en/vacancies/detail/second-job">Backend Engineer</a></h2>
                      <p>Company: DataFlow</p>
                      <p>Location: Geneva</p>
                  </div>
                  
                  <div class="job-listing">
                      <h2><a href="https://example.com/en/vacancies/detail/third-job">Full Stack Developer</a></h2>
                      <p>Company: StartupXYZ</p>
                      <p>Location: Basel</p>
                  </div>
                  
              </div>
              
              <nav class="pagination">
                  <a href="/search?page=1">1</a>
                  <a href="/search?page=2">2</a>
                  <a href="/search?page=3">3</a>
              </nav>
          </main>
      </body>
      </html>
    `;

    const links = extractJobLinks(sampleHtml, "https://jobs.ch/search");

    expect(links).toEqual([
      "https://jobs.ch/en/vacancies/detail/first-job",
      "https://jobs.ch/en/vacancies/detail/second-job",
      "https://example.com/en/vacancies/detail/third-job",
    ]);
  });

  it("deduplicates identical href values", () => {
    const html = `
      <a href="/en/vacancies/detail/role">Role One</a>
      <a href="/en/vacancies/detail/role">Role One Duplicate</a>
    `;

    const links = extractJobLinks(html, "https://jobs.ch/search");

    expect(links).toEqual([
      "https://jobs.ch/en/vacancies/detail/role",
    ]);
  });
});
