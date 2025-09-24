import { load } from 'cheerio';

async function simpleTitleTest() {
  const testUrl = 'https://www.jobs.ch/en/vacancies/detail/ae0d21fe-5df1-41e9-b40c-8a223468a271/';

  try {
    console.log(`Testing title extraction for: ${testUrl}`);

    const response = await fetch(testUrl);
    const html = await response.text();

    const $ = load(html);

    // Test each step of the title extraction
    const title1 = $('meta[property="og:title"]').attr('content');
    const title2 = $('meta[name="twitter:title"]').attr('content');
    const title3 = $('meta[name="title"]').attr('content');
    const title4 = $('h1').first().text();
    const title5 = $('title').text();

    console.log('=== TITLE EXTRACTION STEPS ===');
    console.log('1. OG title:', title1);
    console.log('2. Twitter title:', title2);
    console.log('3. Meta title:', title3);
    console.log('4. H1 title:', title4);
    console.log('5. HTML title:', title5);

    // Test the logical OR chain
    const finalTitle = title1 || title2 || title3 || title4 || title5 || 'Job Position';
    console.log('Final title result:', finalTitle);

  } catch (error) {
    console.error('✗ Test failed:', error);
  }
}

simpleTitleTest();
