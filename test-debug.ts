import { fetchJobAd } from '@/lib/fetchJobAd';
import { parseJobAd } from '@/lib/parseJobAd';

async function debugTitleExtraction() {
  const testUrl = 'https://www.jobs.ch/en/vacancies/detail/ae0d21fe-5df1-41e9-b40c-8a223468a271/';

  try {
    console.log(`Debugging title extraction for: ${testUrl}`);
    const html = await fetchJobAd(testUrl, { timeoutMs: 5000 });
    const parsed = await parseJobAd(html, { sourceUrl: testUrl });

    console.log('=== DEBUG RESULTS ===');
    console.log(`Title: "${parsed.title}" (type: ${typeof parsed.title})`);
    console.log(`Title length: ${parsed.title?.length || 0}`);
    console.log(`Title is null: ${parsed.title === null}`);
    console.log(`Title is undefined: ${parsed.title === undefined}`);
    console.log(`Title is empty string: ${parsed.title === ''}`);
    console.log(`Company: "${parsed.company}"`);
    console.log(`Stack: ${parsed.stack.length} items`);
  } catch (error) {
    console.error('✗ Debug failed:', error);
  }
}

debugTitleExtraction();
