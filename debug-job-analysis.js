// Direct test of job analysis pipeline
import fetch from 'node-fetch';
import { load } from 'cheerio';

const DETAIL_SELECTOR = '[href*="/vacancies/detail"],[href*="/jobs/job"]';

function extractJobLinks(html, baseUrl) {
  if (!html) return [];
  const $ = load(html);
  const resolved = new Set();

  console.info(`[extractJobLinks] searching for job links in ${baseUrl}`);
  console.info(`[extractJobLinks] found ${$(DETAIL_SELECTOR).length} potential job links`);

  $(DETAIL_SELECTOR).each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    const absolute = normalizeUrl(href, baseUrl);
    if (!absolute) {
      console.warn(`[extractJobLinks] failed to normalize URL: ${href}`);
      return;
    }

    console.info(`[extractJobLinks] extracted job URL: ${absolute}`);
    resolved.add(absolute);
  });

  console.info(`[extractJobLinks] returning ${resolved.size} unique job URLs`);
  return Array.from(resolved);
}

function normalizeUrl(href, baseUrl) {
  try {
    const url = new URL(href, baseUrl);
    return url.toString();
  } catch {
    return null;
  }
}

function shouldSkipJobUrl(url) {
  if (!url || typeof url !== 'string') {
    return { skip: true, reason: 'Invalid URL' };
  }

  try {
    const urlObj = new URL(url);
    console.info(`[shouldSkipJobUrl] checking URL: ${url}`);
    console.info(`[shouldSkipJobUrl] hostname: ${urlObj.hostname}, pathname: ${urlObj.pathname}`);

    // Skip non-jobs.ch URLs (for now, we only process jobs.ch)
    if (!urlObj.hostname.includes('jobs.ch')) {
      console.info(`[shouldSkipJobUrl] skipping non-jobs.ch URL: ${url}`);
      return { skip: true, reason: 'Non-jobs.ch domain' };
    }

    // Skip URLs that don't match the expected job detail pattern
    if (!urlObj.pathname.includes('/vacancies/detail/')) {
      console.info(`[shouldSkipJobUrl] skipping non-detail URL: ${url}`);
      return { skip: true, reason: 'Not a job detail page' };
    }

    // Skip URLs with invalid or missing job IDs
    const jobIdMatch = urlObj.pathname.match(/\/vacancies\/detail\/([^\/]+)/);
    if (!jobIdMatch || !jobIdMatch[1] || jobIdMatch[1].length < 10) {
      console.info(`[shouldSkipJobUrl] skipping invalid job ID URL: ${url}, jobId: ${jobIdMatch?.[1]}`);
      return { skip: true, reason: 'Invalid or missing job ID' };
    }

    console.info(`[shouldSkipJobUrl] accepting URL: ${url}`);
    // Skip duplicate URLs (this check will be done by the caller)
    return { skip: false };
  } catch (error) {
    console.error(`[shouldSkipJobUrl] error parsing URL ${url}:`, error);
    return { skip: true, reason: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

async function debugJobAnalysis() {
  console.log('=== Debugging Job Analysis Pipeline ===');

  // Step 1: Test URL extraction
  console.log('\n1. Testing URL extraction...');
  try {
    const searchUrl = 'https://www.jobs.ch/en/vacancies?term=frontend&page=1';
    const response = await fetch(searchUrl);
    const html = await response.text();

    console.log(`Fetched search page, HTML length: ${html.length}`);

    const jobLinks = extractJobLinks(html, searchUrl);
    console.log(`Extracted ${jobLinks.length} job links`);

    if (jobLinks.length > 0) {
      console.log('First few job links:');
      jobLinks.slice(0, 3).forEach((link, i) => {
        console.log(`  ${i + 1}. ${link}`);
      });

      // Step 2: Test URL filtering
      console.log('\n2. Testing URL filtering...');
      jobLinks.slice(0, 5).forEach((link, i) => {
        const skipResult = shouldSkipJobUrl(link);
        console.log(`  ${i + 1}. ${link} -> ${skipResult.skip ? 'SKIP' : 'ACCEPT'} (${skipResult.reason || 'accepted'})`);
      });

      // Step 3: Test fetching a single job
      if (jobLinks.length > 0) {
        console.log('\n3. Testing single job fetch...');
        const firstJobUrl = jobLinks[0];
        console.log(`Fetching: ${firstJobUrl}`);

        const jobResponse = await fetch(firstJobUrl);
        console.log(`Response status: ${jobResponse.status}`);
        console.log(`Response headers:`, Object.fromEntries(jobResponse.headers.entries()));

        if (jobResponse.status === 200) {
          const jobHtml = await jobResponse.text();
          console.log(`Job HTML length: ${jobHtml.length}`);
          console.log('Job HTML preview:');
          console.log(jobHtml.substring(0, 500) + '...');
        } else if (jobResponse.status === 301) {
          const redirectUrl = jobResponse.headers.get('location');
          console.log(`Redirect to: ${redirectUrl}`);
        }
      }
    }

  } catch (error) {
    console.error('Error during debugging:', error);
  }

  console.log('\n=== Debug Complete ===');
}

debugJobAnalysis();
