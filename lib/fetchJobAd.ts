import fetch from "node-fetch";
import { withRetry, withTimeout } from "./retryUtils";
import { extractErrorMessage } from "./apiUtils";

export interface FetchJobAdOptions {
  timeoutMs?: number;
  retryCount?: number;
  clearJobAdData?: boolean;
}

const DEFAULT_TIMEOUT_MS = 8_000; // Increased from 6s to 8s
const DEFAULT_RETRY_COUNT = 2; // Increased from 1 to 2 retries
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch job ad: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text")) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJobAd(
  url: string,
  options: FetchJobAdOptions = {},
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retryCount ?? DEFAULT_RETRY_COUNT;
  const clearJobAdData = options.clearJobAdData ?? false;

  return withRetry(
    async () => {
      console.info(`[fetchJobAd] fetching ${url}${clearJobAdData ? ' (clearing job ad data)' : ''}`);
      return await fetchWithTimeout(url, timeoutMs);
    },
    {
      maxRetries: retries,
      baseDelayMs: 500,
      maxDelayMs: 2000,
      onRetry: (attempt, error) => {
        const errorType = error instanceof Error ? error.constructor.name : 'Unknown';
        const isTimeout = error instanceof Error && (error.message.includes('aborted') || error.name === 'AbortError');
        console.warn(`[fetchJobAd] attempt ${attempt} failed (${errorType}${isTimeout ? ' - timeout' : ''})`, {
          url,
          attempt,
          error: extractErrorMessage(error)
        });
      }
    }
  );
}
