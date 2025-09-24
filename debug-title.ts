import { load } from 'cheerio';

async function debugTitleExtraction() {
  const testUrl = 'https://www.jobs.ch/en/vacancies/detail/ae0d21fe-5df1-41e9-b40c-8a223468a271/';

  try {
    console.log(`Debugging title extraction for: ${testUrl}`);

    const response = await fetch(testUrl);
    const html = await response.text();

    console.log('=== HTML TITLE DEBUG ===');
    console.log('Full title tag:', html.match(/<title[^>]*>.*?<\/title>/s)?.[0] || 'NO TITLE TAG FOUND');

    const $ = load(html);

    console.log('=== CHEERIO TITLE DEBUG ===');
    console.log('Title from cheerio:', $('title').text() || 'NO TITLE FROM CHEERIO');

    console.log('=== META TAG DEBUG ===');
    console.log('OG title:', $('meta[property="og:title"]').attr('content') || 'NO OG TITLE');
    console.log('Twitter title:', $('meta[name="twitter:title"]').attr('content') || 'NO TWITTER TITLE');
    console.log('Meta title:', $('meta[name="title"]').attr('content') || 'NO META TITLE');

    console.log('=== HEADING DEBUG ===');
    console.log('H1 text:', $('h1').first().text() || 'NO H1 FOUND');

    console.log('=== BODY DEBUG ===');
    console.log('Has main element:', $('main').length > 0);
    console.log('Has body element:', $('body').length > 0);
    console.log('Body text length:', $('body').text().length);

  } catch (error) {
    console.error('✗ Debug failed:', error);
  }
}

debugTitleExtraction();
