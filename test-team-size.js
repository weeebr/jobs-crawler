#!/usr/bin/env node

import { readFileSync } from 'fs';
import { parseJobAd } from './lib/parseJobAd';

async function testTeamSizeExtraction() {
  try {
    // Read one of the fixture files that mentions team
    const html = readFileSync('./lib/__tests__/fixtures/job-2025-09-22T12-00-00-155Z.html', 'utf8');
    
    console.log('Testing teamSize extraction...');
    const result = await parseJobAd(html, { sourceUrl: 'https://example.com/job' });
    
    console.log('Parsed job data:');
    console.log('- Title:', result.title);
    console.log('- Company:', result.company);
    console.log('- Team Size:', result.teamSize || 'NOT FOUND');
    console.log('- Workload:', result.workload || 'NOT FOUND');
    console.log('- Duration:', result.duration || 'NOT FOUND');
    console.log('- Location:', result.location || 'NOT FOUND');
    
    if (result.teamSize) {
      console.log('✅ Team size successfully extracted:', result.teamSize);
    } else {
      console.log('❌ Team size not found in extraction');
    }
    
  } catch (error) {
    console.error('Error testing team size extraction:', error);
  }
}

testTeamSizeExtraction();
