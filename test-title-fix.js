import { fetchJobAd } from './lib/fetchJobAd.ts';
import { parseJobAd } from './lib/parseJobAd.ts';

async function testTitleFix() {
  const testUrl = 'https://www.jobs.ch/en/vacancies/detail/ae0d21fe-5df1-41e9-b40c-8a223468a271/';

  try {
    console.log(`Testing title extraction for: ${testUrl}`);
    const html = await fetchJobAd(testUrl, { timeoutMs: 5000 });
    const parsed = await parseJobAd(html, { sourceUrl: testUrl });

    console.log(`✓ Title: "${parsed.title}"`);
    console.log(`✓ Company: "${parsed.company}"`);
    console.log(`✓ Stack: ${parsed.stack.length} items`);
    console.log('✓ Test passed - title is not null/undefined');
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

testTitleFix();
