import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fetchJobAd } from "@/lib/fetchJobAd";
import { extractJobLinks } from "@/lib/extractJobLinks";

// Mock the dependencies
vi.mock("@/lib/fetchJobAd");
vi.mock("@/lib/extractJobLinks");

const fetchJobAdMock = vi.mocked(fetchJobAd);
const extractJobLinksMock = vi.mocked(extractJobLinks);

// Import the function we want to test (we'll need to extract it from the route)
// For now, let's create a testable version
async function collectJobLinks(
  searchUrl: string,
  fetchOptions: { timeoutMs: number; retryCount: number }
): Promise<{ jobLinks: string[]; fetchedPages: number }> {
  const MAX_SEARCH_PAGES = 12;
  const initialUrl = new URL(searchUrl);
  const initialPage = parseNonNegativeInt(initialUrl.searchParams.get("page")) ?? 1;
  const normalizedInitialUrl = initialUrl.toString();

  const seen = new Set<string>();
  let fetchedPages = 0;

  for (let offset = 0; offset < MAX_SEARCH_PAGES; offset += 1) {
    const pageNumber = initialPage + offset;
    const pageUrl =
      offset === 0
        ? normalizedInitialUrl
        : buildPageUrl(normalizedInitialUrl, pageNumber);

    const html = await fetchJobAd(pageUrl, fetchOptions);
    fetchedPages += 1;

    const resolvedLinks = extractJobLinks(html, pageUrl);
    let newLinks = 0;
    for (const link of resolvedLinks) {
      if (!seen.has(link)) {
        seen.add(link);
        newLinks += 1;
      }
    }

    // This is the critical logic - if no new links are found, we should stop
    if (newLinks === 0) {
      console.info(`[collectJobLinks] No new links found on page ${pageNumber}, stopping pagination`);
      break;
    }
  }

  return { jobLinks: Array.from(seen), fetchedPages };
}

function buildPageUrl(baseUrl: string, pageNumber: number): string {
  const url = new URL(baseUrl);
  url.searchParams.set("page", String(pageNumber));
  return url.toString();
}

function parseNonNegativeInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

describe("collectJobLinks", () => {
  beforeEach(() => {
    fetchJobAdMock.mockReset();
    extractJobLinksMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should stop pagination when no new links are found", async () => {
    // Mock: Page 1 has 2 unique links
    fetchJobAdMock.mockResolvedValueOnce("<html>page1</html>");
    extractJobLinksMock.mockReturnValueOnce([
      "https://jobs.ch/vacancies/detail/job1",
      "https://jobs.ch/vacancies/detail/job2"
    ]);

    // Mock: Page 2 has 1 new link, 1 duplicate
    fetchJobAdMock.mockResolvedValueOnce("<html>page2</html>");
    extractJobLinksMock.mockReturnValueOnce([
      "https://jobs.ch/vacancies/detail/job1", // duplicate
      "https://jobs.ch/vacancies/detail/job3"  // new
    ]);

    // Mock: Page 3 has only duplicates (this should trigger stop)
    fetchJobAdMock.mockResolvedValueOnce("<html>page3</html>");
    extractJobLinksMock.mockReturnValueOnce([
      "https://jobs.ch/vacancies/detail/job1", // duplicate
      "https://jobs.ch/vacancies/detail/job2"  // duplicate
    ]);

    const result = await collectJobLinks(
      "https://jobs.ch/en/vacancies/?term=frontend%20developer",
      { timeoutMs: 6000, retryCount: 1 }
    );

    // Should have fetched 3 pages but stopped after finding no new links
    expect(fetchJobAdMock).toHaveBeenCalledTimes(3);
    expect(result.fetchedPages).toBe(3);
    expect(result.jobLinks).toEqual([
      "https://jobs.ch/vacancies/detail/job1",
      "https://jobs.ch/vacancies/detail/job2", 
      "https://jobs.ch/vacancies/detail/job3"
    ]);
  });

  it("should handle empty search results gracefully", async () => {
    // Mock: All pages return no links
    fetchJobAdMock.mockResolvedValue("<html>no jobs</html>");
    extractJobLinksMock.mockReturnValue([]);

    const result = await collectJobLinks(
      "https://jobs.ch/en/vacancies/?term=nonexistent",
      { timeoutMs: 6000, retryCount: 1 }
    );

    // Should stop after first page with no links
    expect(fetchJobAdMock).toHaveBeenCalledTimes(1);
    expect(result.fetchedPages).toBe(1);
    expect(result.jobLinks).toEqual([]);
  });

  it("should respect MAX_SEARCH_PAGES limit", async () => {
    // Mock: Every page returns new links (simulating infinite results)
    fetchJobAdMock.mockImplementation((url) => {
      const pageNum = new URL(url).searchParams.get("page") || "1";
      return Promise.resolve(`<html>page${pageNum}</html>`);
    });
    
    extractJobLinksMock.mockImplementation((html, baseUrl) => {
      const pageNum = new URL(baseUrl).searchParams.get("page") || "1";
      return [`https://jobs.ch/vacancies/detail/job-${pageNum}`];
    });

    const result = await collectJobLinks(
      "https://jobs.ch/en/vacancies/?term=frontend%20developer",
      { timeoutMs: 6000, retryCount: 1 }
    );

    // Should stop at MAX_SEARCH_PAGES (12)
    expect(fetchJobAdMock).toHaveBeenCalledTimes(12);
    expect(result.fetchedPages).toBe(12);
    expect(result.jobLinks).toHaveLength(12);
  });

  it("should handle mixed results correctly", async () => {
    // Mock: Page 1 - 3 new links
    fetchJobAdMock.mockResolvedValueOnce("<html>page1</html>");
    extractJobLinksMock.mockReturnValueOnce([
      "https://jobs.ch/vacancies/detail/job1",
      "https://jobs.ch/vacancies/detail/job2",
      "https://jobs.ch/vacancies/detail/job3"
    ]);

    // Mock: Page 2 - 2 new links, 1 duplicate
    fetchJobAdMock.mockResolvedValueOnce("<html>page2</html>");
    extractJobLinksMock.mockReturnValueOnce([
      "https://jobs.ch/vacancies/detail/job1", // duplicate
      "https://jobs.ch/vacancies/detail/job4", // new
      "https://jobs.ch/vacancies/detail/job5"  // new
    ]);

    // Mock: Page 3 - only duplicates
    fetchJobAdMock.mockResolvedValueOnce("<html>page3</html>");
    extractJobLinksMock.mockReturnValueOnce([
      "https://jobs.ch/vacancies/detail/job1", // duplicate
      "https://jobs.ch/vacancies/detail/job2"  // duplicate
    ]);

    const result = await collectJobLinks(
      "https://jobs.ch/en/vacancies/?term=frontend%20developer",
      { timeoutMs: 6000, retryCount: 1 }
    );

    expect(fetchJobAdMock).toHaveBeenCalledTimes(3);
    expect(result.fetchedPages).toBe(3);
    expect(result.jobLinks).toEqual([
      "https://jobs.ch/vacancies/detail/job1",
      "https://jobs.ch/vacancies/detail/job2",
      "https://jobs.ch/vacancies/detail/job3",
      "https://jobs.ch/vacancies/detail/job4",
      "https://jobs.ch/vacancies/detail/job5"
    ]);
  });
});
