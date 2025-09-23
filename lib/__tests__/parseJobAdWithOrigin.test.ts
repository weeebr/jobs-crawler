import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseJobAd } from '../parseJobAd';
import type { JobAdFetched } from '../schemas';

// Mock the motto extraction
vi.mock('../jobAd/metadata/mottoLLM', () => ({
  extractMottoLLM: vi.fn()
}));

// Mock other dependencies
vi.mock('../jobAd/metadata/sizeAndMotto', () => ({
  extractSize: vi.fn().mockReturnValue('50')
}));

vi.mock('../extractTech', () => ({
  extractTech: vi.fn().mockReturnValue(['React', 'TypeScript'])
}));

vi.mock('../jobAd/sections', () => ({
  collectJobSectionsHeuristic: vi.fn().mockReturnValue({
    qualifications: ['5+ years experience'],
    roles: ['Develop applications'],
    benefits: ['Competitive salary']
  })
}));

vi.mock('../classifyJobSections', () => ({
  classifyJobSections: vi.fn().mockResolvedValue(null)
}));

vi.mock('../jobAd/metadata/structuredExtractor', () => ({
  extractEnhancedMetadata: vi.fn().mockReturnValue({
    publishedAt: '2024-01-01',
    location: 'Remote',
    workload: 'Full-time',
    duration: 'Permanent',
    language: 'English'
  })
}));

vi.mock('../jobAd/metadata/publishedAt', () => ({
  extractPublishedAt: vi.fn().mockReturnValue('2024-01-01')
}));

vi.mock('../jobAd/metadata/location', () => ({
  extractLocation: vi.fn().mockReturnValue('Remote')
}));

vi.mock('../jobAd/metadata/workload', () => ({
  extractWorkload: vi.fn().mockReturnValue('Full-time')
}));

vi.mock('../jobAd/metadata/duration', () => ({
  extractDuration: vi.fn().mockReturnValue('Permanent')
}));

vi.mock('../jobAd/metadata/language', () => ({
  extractLanguage: vi.fn().mockReturnValue('English')
}));

describe('parseJobAd with mottoOrigin', () => {
  let mockExtractMottoLLM: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mottoModule = await import('../jobAd/metadata/mottoLLM');
    mockExtractMottoLLM = vi.mocked(mottoModule.extractMottoLLM);
  });

  it('should include mottoOrigin when motto is found', async () => {
    mockExtractMottoLLM.mockResolvedValue({
      motto: 'Innovation through technology',
      found: true,
      reasoning: 'Found clear company motto',
      origin: {
        source: 'job_ad',
        sourceUrl: 'https://example.com/job',
        confidence: 'high',
        extractedFrom: 'LLM analysis of job posting'
      }
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
    expect(result.mottoOrigin).toEqual({
      source: 'job_ad',
      sourceUrl: 'https://example.com/job',
      confidence: 'high',
      extractedFrom: 'LLM analysis of job posting'
    });
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

  it('should include mottoOrigin for fallback scenarios', async () => {
    mockExtractMottoLLM.mockResolvedValue({
      motto: 'Innovation through technology',
      found: true,
      reasoning: 'No API key available, using keyword fallback',
      origin: {
        source: 'fallback',
        sourceUrl: 'https://example.com/job',
        confidence: 'low',
        extractedFrom: 'keyword-based extraction'
      }
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
    expect(result.mottoOrigin).toEqual({
      source: 'fallback',
      sourceUrl: 'https://example.com/job',
      confidence: 'low',
      extractedFrom: 'keyword-based extraction'
    });
  });

  it('should include mottoOrigin for API error scenarios', async () => {
    mockExtractMottoLLM.mockResolvedValue({
      motto: '-',
      found: false,
      reasoning: 'API error: 401',
      origin: {
        source: 'api_error',
        sourceUrl: 'https://example.com/job',
        confidence: 'low',
        extractedFrom: 'API request failed'
      }
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

    expect(result.motto).toBeUndefined();
    expect(result.mottoOrigin).toEqual({
      source: 'api_error',
      sourceUrl: 'https://example.com/job',
      confidence: 'low',
      extractedFrom: 'API request failed'
    });
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

  it('should preserve all other job data when including mottoOrigin', async () => {
    mockExtractMottoLLM.mockResolvedValue({
      motto: 'Innovation through technology',
      found: true,
      reasoning: 'Found clear company motto',
      origin: {
        source: 'job_ad',
        sourceUrl: 'https://example.com/job',
        confidence: 'high',
        extractedFrom: 'LLM analysis of job posting'
      }
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

    // Check that all expected fields are present
    expect(result.title).toBe('Senior Developer');
    expect(result.company).toBe('Example');
    expect(result.stack).toEqual(['React', 'TypeScript']);
    expect(result.qualifications).toEqual(['5+ years experience']);
    expect(result.roles).toEqual(['Develop applications']);
    expect(result.benefits).toEqual(['Competitive salary']);
    expect(result.size).toBe('50');
    expect(result.publishedAt).toBe('2024-01-01');
    expect(result.location).toBe('Remote');
    expect(result.workload).toBe('Full-time');
    expect(result.duration).toBe('Permanent');
    expect(result.language).toBe('English');
    expect(result.sourceUrl).toBe('https://example.com/job');
    expect(result.jobUrl).toBe('https://example.com/job');
    expect(result.fetchedAt).toBeTypeOf('number');
    expect(result.sourceDomain).toBe('example.com');
    
    // Check motto and origin
    expect(result.motto).toBe('Innovation through technology');
    expect(result.mottoOrigin).toEqual({
      source: 'job_ad',
      sourceUrl: 'https://example.com/job',
      confidence: 'high',
      extractedFrom: 'LLM analysis of job posting'
    });
  });
});
