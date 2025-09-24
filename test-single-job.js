// Test analyzing a single job
import fetch from 'node-fetch';
import { load } from 'cheerio';

async function testSingleJob() {
  console.log('=== Testing Single Job Analysis ===');

  const jobUrl = 'https://www.jobs.ch/en/vacancies/detail/35017a7a-cd29-4c18-bc52-a524290f528c/';

  try {
    console.log(`Fetching job: ${jobUrl}`);
    const response = await fetch(jobUrl);
    const html = await response.text();

    console.log(`Fetched ${html.length} characters of HTML`);

    // Test basic HTML parsing
    const $ = load(html);
    const title = $('title').text().trim();
    console.log(`Job title: ${title}`);

    // Test if we can find key elements
    const h1Elements = $('h1');
    console.log(`Found ${h1Elements.length} h1 elements`);

    h1Elements.each((_, el) => {
      console.log(`H1: ${$(el).text().trim()}`);
    });

    // Test for common job posting elements
    console.log('\nChecking for job posting elements...');

    // Look for job title patterns
    const titleSelectors = ['h1', '.job-title', '.vacancy-title', '[data-testid="job-title"]'];
    let foundTitle = false;
    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        console.log(`Found title with ${selector}: ${element.text().trim()}`);
        foundTitle = true;
        break;
      }
    }

    // Look for company name patterns
    const companySelectors = ['.company-name', '.employer-name', '[data-testid="company-name"]'];
    let foundCompany = false;
    for (const selector of companySelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        console.log(`Found company with ${selector}: ${element.text().trim()}`);
        foundCompany = true;
        break;
      }
    }

    // Look for job description
    const descSelectors = ['.job-description', '.vacancy-description', '.description'];
    let foundDescription = false;
    for (const selector of descSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        console.log(`Found description with ${selector} (${element.text().length} characters)`);
        foundDescription = true;
        break;
      }
    }

    console.log(`Title found: ${foundTitle}, Company found: ${foundCompany}, Description found: ${foundDescription}`);

  } catch (error) {
    console.error('Error:', error);
    console.error('Stack trace:', error.stack);
  }
}

testSingleJob();
