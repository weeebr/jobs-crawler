import { load } from 'cheerio';
import { getReadableContent } from '@/lib/jobAd/readability';

async function debugReadability() {
  const testUrl = 'https://www.jobs.ch/en/vacancies/detail/ae0d21fe-5df1-41e9-b40c-8a223468a271/';

  try {
    console.log(`Debugging readability for: ${testUrl}`);

    const response = await fetch(testUrl);
    const html = await response.text();

    const readable = getReadableContent(html, testUrl);

    console.log('=== READABILITY DEBUG ===');
    console.log('Readable title:', readable.title || 'NO READABLE TITLE');
    console.log('Readable content length:', readable.textContent.length);
    console.log('Readable has content:', !!readable.contentHtml);

    // Now test the selectTitle function
    const $ = load(html);
    const selectTitle = $('meta[property="og:title"]').attr('content') ||
                       $('meta[name="twitter:title"]').attr('content') ||
                       $('meta[name="title"]').attr('content') ||
                       $('h1').first().text() ||
                       $('title').text();

    const fallbackTitle = readable.title;

    console.log('=== TITLE SELECTION DEBUG ===');
    console.log('selectTitle result:', selectTitle || 'NO SELECT TITLE');
    console.log('fallbackTitle result:', fallbackTitle || 'NO FALLBACK TITLE');

    const finalTitle = selectTitle || fallbackTitle || 'Job Position';

    console.log('Final title:', finalTitle);

  } catch (error) {
    console.error('✗ Debug failed:', error);
  }
}

debugReadability();
