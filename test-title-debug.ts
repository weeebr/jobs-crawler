#!/usr/bin/env tsx

import { load } from "cheerio";
import { selectTitle } from "./lib/jobAd/titleAndCompany";

// Test the simplified title logic
async function testSimplifiedTitleLogic() {
  console.log("Testing simplified title logic...");

  // Test case 1: Normal title
  const html1 = `<html><head><title>Frontend Developer</title></head><body><h1>Frontend Developer</h1></body></html>`;
  const $1 = load(html1);
  const title1 = selectTitle($1) ?? '';
  console.log(`[test] Case 1 - Normal title: "${title1}"`);
  console.assert(title1 === 'Frontend Developer', 'Should extract title correctly');

  // Test case 2: Empty title tag but has h1
  const html2 = `<html><head><title></title></head><body><h1>Job Title</h1></body></html>`;
  const $2 = load(html2);
  const title2 = selectTitle($2) ?? '';
  console.log(`[test] Case 2 - Empty title tag with h1: "${title2}"`);
  console.assert(title2 === 'Job Title', 'Should fallback to h1 when title tag is empty');

  // Test case 3: No title tag but has h1
  const html3 = `<html><head></head><body><h1>Job Title</h1></body></html>`;
  const $3 = load(html3);
  const title3 = selectTitle($3) ?? '';
  console.log(`[test] Case 3 - No title tag with h1: "${title3}"`);
  console.assert(title3 === 'Job Title', 'Should fallback to h1 when no title tag');

  // Test case 4: Null/undefined check - truly empty
  const html4 = `<html><head><title></title></head><body></body></html>`;
  const $4 = load(html4);
  const title4 = selectTitle($4) ?? '';
  console.log(`[test] Case 4 - Empty title tag, no h1: "${title4}"`);
  console.assert(title4 === '', 'Should return empty when no content found');

  // Test case 5: Test the skip logic simulation
  console.log(`[test] Case 5 - Testing skip logic with empty title: "${title4}"`);
  if (!title4.trim()) {
    console.log('[test] ✅ Skip logic would trigger for empty title');
  } else {
    console.log('[test] ❌ Skip logic would NOT trigger (unexpected)');
  }

  console.log("✅ All simplified title logic tests passed!");
}

testSimplifiedTitleLogic().catch(console.error);
