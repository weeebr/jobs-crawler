import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseJobAd } from '../../parseJobAd';

// Mock the motto extraction
vi.mock('../../jobAd/metadata/mottoLLM', () => ({
  extractMottoLLM: vi.fn()
}));

// Mock other dependencies
vi.mock('../../jobAd/metadata/sizeAndMotto', () => ({
  extractSize: vi.fn().mockReturnValue('50')
}));

vi.mock('../../extractTech', () => ({
  extractTech: vi.fn().mockReturnValue(['React', 'TypeScript'])
}));

vi.mock('../../jobAd/sections', () => ({
  collectJobSectionsHeuristic: vi.fn().mockReturnValue({
    qualifications: ['5+ years experience'],
    roles: ['Develop applications'],
    benefits: ['Competitive salary']
  })
}));

vi.mock('../../jobAd/metadata/structuredExtractor', () => ({
  extractEnhancedMetadata: vi.fn().mockReturnValue({
    publishedAt: '2024-01-01',
    location: 'Remote',
    workload: 'Full-time',
    duration: 'Permanent',
    language: 'English'
  })
}));

describe('parseJobAd - missing motto origin', () => {
  let mockExtractMottoLLM: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mottoModule = await import('../../jobAd/metadata/mottoLLM');
    mockExtractMottoLLM = vi.mocked(mottoModule.extractMottoLLM);
  });

  it('should handle missing mottoOrigin gracefully', async () => {
    mockExtractMottoLLM.mockResolvedValue({
      motto: 'Innovation through technology',
      found: true,
      reasoning: 'Found clear company motto'
      // No origin field
    });

    const html = `
      <html>
        <head><title>Senior Developer</title></head>
        <body>
          <h1>Senior Developer</h1>
          <p>Company: TechCorp</p>
          <p>We believe in innovation and creating meaningful impact through technology.</p>
        </body>
      </html>
    `;

    const result = await parseJobAd(html, { sourceUrl: 'https://example.com/job' });

    expect(result.motto).toBe('Innovation through technology');
    expect(result.mottoOrigin).toBeUndefined();
  });
});
