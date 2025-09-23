#!/usr/bin/env node

import { readFileSync } from 'fs';
import { parseJobAd } from './lib/parseJobAd';

async function testCompanySizeExtraction() {
  try {
    // Read one of the fixture files that mentions size
    const html = readFileSync('./lib/__tests__/fixtures/job-2025-09-22T12-00-00-155Z.html', 'utf8');
    
    console.log('Testing companySize extraction...');
    const result = await parseJobAd(html, { sourceUrl: 'https://example.com/job' });
    
    console.log('Parsed job data:');
    console.log('- Title:', result.title);
    console.log('- Company:', result.company);
    console.log('- Company Size:', result.companySize || 'NOT FOUND');
    console.log('- Workload:', result.workload || 'NOT FOUND');
    console.log('- Duration:', result.duration || 'NOT FOUND');
    console.log('- Location:', result.location || 'NOT FOUND');
    
    if (result.companySize) {
      console.log('✅ Company size successfully extracted:', result.companySize);
    } else {
      console.log('❌ Company size not found in extraction');
    }
    
  } catch (error) {
    console.error('Error testing company size extraction:', error);
  }
}

testCompanySizeExtraction();
