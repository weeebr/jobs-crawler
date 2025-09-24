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

describe('parseJobAd - motto origin when not found', () => {
  let mockExtractMottoLLM: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mottoModule = await import('../../jobAd/metadata/mottoLLM');
    mockExtractMottoLLM = vi.mocked(mottoModule.extractMottoLLM);
  });

  it('should include mottoOrigin when no motto is found', async () => {
    mockExtractMottoLLM.mockResolvedValue({
      motto: '-',
      found: false,
      reasoning: 'No clear company motto found',
      origin: {
        source: 'job_ad',
        sourceUrl: 'https://example.com/job',
        confidence: 'low',
        extractedFrom: 'No motto found in job posting'
      }
    });

    const html = `
      <html>
        <head><title>Senior Developer</title></head>
        <body>
          <h1>Senior Developer</h1>
          <p>Company: TechCorp</p>
          <p>Just a regular job posting with no company values.</p>
        </body>
      </html>
    `;

    const result = await parseJobAd(html, { sourceUrl: 'https://example.com/job' });

    expect(result.motto).toBeUndefined();
    expect(result.mottoOrigin).toEqual({
      source: 'job_ad',
      sourceUrl: 'https://example.com/job',
      confidence: 'low',
      extractedFrom: 'No motto found in job posting'
    });
  });
});
