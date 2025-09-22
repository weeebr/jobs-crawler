import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseJobAd } from '../parseJobAd';
import type { JobAdParsed } from '../schemas';

// Mock all the dependencies
vi.mock('../jobAd/metadata/mottoLLM', () => ({
  extractMottoLLM: vi.fn()
}));

vi.mock('../jobAd/metadata/sizeAndMotto', () => ({
  extractSize: vi.fn().mockReturnValue('50')
}));

vi.mock('../extractTech', () => ({
  extractTech: vi.fn().mockReturnValue(['React', 'TypeScript', 'Node.js'])
}));

vi.mock('../jobAd/sections', () => ({
  collectJobSectionsHeuristic: vi.fn().mockReturnValue({
    qualifications: [
      '5+ years of experience with React and TypeScript',
      'Strong background in Node.js and GraphQL',
      'Experience with AWS cloud services'
    ],
    roles: [
      'Develop and maintain web applications',
      'Design and implement APIs',
      'Collaborate with cross-functional teams'
    ],
    benefits: [
      'Competitive salary and equity',
      'Flexible working arrangements',
      'Professional development opportunities'
    ]
  })
}));

vi.mock('../classifyJobSections', () => ({
  classifyJobSections: vi.fn().mockResolvedValue(null)
}));

vi.mock('../jobAd/metadata/structuredExtractor', () => ({
  extractEnhancedMetadata: vi.fn().mockReturnValue({
    publishedAt: '2024-01-15',
    location: 'San Francisco, CA',
    workload: 'Full-time',
    duration: 'Permanent',
    language: 'English'
  })
}));

vi.mock('../jobAd/metadata/publishedAt', () => ({
  extractPublishedAt: vi.fn().mockReturnValue('2024-01-15')
}));

vi.mock('../jobAd/metadata/location', () => ({
  extractLocation: vi.fn().mockReturnValue('San Francisco, CA')
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

describe('mottoOrigin integration tests', () => {
  let mockExtractMottoLLM: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mottoModule = await import('../jobAd/metadata/mottoLLM');
    mockExtractMottoLLM = vi.mocked(mottoModule.extractMottoLLM);
  });

  it('should handle complete job parsing with mottoOrigin from job ad', async () => {
    mockExtractMottoLLM.mockResolvedValue({
      motto: 'Innovation through technology',
      found: true,
      reasoning: 'Found clear company motto in job posting',
      origin: {
        source: 'job_ad',
        sourceUrl: 'https://techcorp.com/careers/senior-developer',
        confidence: 'high',
        extractedFrom: 'LLM analysis of job posting'
      }
    });

    const html = `
      <html>
        <head>
          <title>Senior Full Stack Developer - TechCorp</title>
          <meta property="og:title" content="Senior Full Stack Developer">
        </head>
        <body>
          <h1>Senior Full Stack Developer</h1>
          <div class="company">TechCorp</div>
          <div class="job-description">
            <h2>About Us</h2>
            <p>We believe in innovation, collaboration, and creating meaningful impact through technology. Our mission is to build the future of software development.</p>
            
            <h2>Requirements</h2>
            <ul>
              <li>5+ years of experience with React and TypeScript</li>
              <li>Strong background in Node.js and GraphQL</li>
              <li>Experience with AWS cloud services</li>
            </ul>
            
            <h2>Responsibilities</h2>
            <ul>
              <li>Develop and maintain web applications</li>
              <li>Design and implement APIs</li>
              <li>Collaborate with cross-functional teams</li>
            </ul>
            
            <h2>Benefits</h2>
            <ul>
              <li>Competitive salary and equity</li>
              <li>Flexible working arrangements</li>
              <li>Professional development opportunities</li>
            </ul>
          </div>
        </body>
      </html>
    `;

    const result = await parseJobAd(html, { 
      sourceUrl: 'https://techcorp.com/careers/senior-developer' 
    });

    // Verify the complete parsed result
    expect(result.title).toBe('Senior Full Stack Developer');
    expect(result.company).toBe('TechCorp');
    expect(result.stack).toEqual(['React', 'TypeScript', 'Node.js']);
    expect(result.qualifications).toHaveLength(3);
    expect(result.roles).toHaveLength(3);
    expect(result.benefits).toHaveLength(3);
    expect(result.size).toBe('50');
    expect(result.publishedAt).toBe('2024-01-15');
    expect(result.location).toBe('San Francisco, CA');
    expect(result.workload).toBe('Full-time');
    expect(result.duration).toBe('Permanent');
    expect(result.language).toBe('English');
    expect(result.sourceUrl).toBe('https://techcorp.com/careers/senior-developer');
    expect(result.jobUrl).toBe('https://techcorp.com/careers/senior-developer');
    expect(result.sourceDomain).toBe('techcorp.com');
    expect(result.fetchedAt).toBeTypeOf('number');

    // Verify motto and origin
    expect(result.motto).toBe('Innovation through technology');
    expect(result.mottoOrigin).toEqual({
      source: 'job_ad',
      sourceUrl: 'https://techcorp.com/careers/senior-developer',
      confidence: 'high',
      extractedFrom: 'LLM analysis of job posting'
    });

    // Verify the motto extraction was called with correct parameters
    expect(mockExtractMottoLLM).toHaveBeenCalledWith(
      expect.stringContaining('We believe in innovation, collaboration, and creating meaningful impact through technology'),
      'TechCorp',
      'https://techcorp.com/careers/senior-developer'
    );
  });

  it('should handle job parsing with fallback motto extraction', async () => {
    mockExtractMottoLLM.mockResolvedValue({
      motto: 'Innovation through technology',
      found: true,
      reasoning: 'No API key available, using keyword fallback',
      origin: {
        source: 'fallback',
        sourceUrl: 'https://startup.com/jobs/developer',
        confidence: 'low',
        extractedFrom: 'keyword-based extraction'
      }
    });

    const html = `
      <html>
        <head><title>Full Stack Developer</title></head>
        <body>
          <h1>Full Stack Developer</h1>
          <div class="company">StartupCorp</div>
          <p>We are looking for a talented developer to join our team.</p>
        </body>
      </html>
    `;

    const result = await parseJobAd(html, { 
      sourceUrl: 'https://startup.com/jobs/developer' 
    });

    expect(result.motto).toBe('Innovation through technology');
    expect(result.mottoOrigin).toEqual({
      source: 'fallback',
      sourceUrl: 'https://startup.com/jobs/developer',
      confidence: 'low',
      extractedFrom: 'keyword-based extraction'
    });
  });

  it('should handle job parsing with API error', async () => {
    mockExtractMottoLLM.mockResolvedValue({
      motto: '-',
      found: false,
      reasoning: 'API error: 401',
      origin: {
        source: 'api_error',
        sourceUrl: 'https://company.com/jobs/engineer',
        confidence: 'low',
        extractedFrom: 'API request failed'
      }
    });

    const html = `
      <html>
        <head><title>Software Engineer</title></head>
        <body>
          <h1>Software Engineer</h1>
          <div class="company">BigCorp</div>
          <p>Join our engineering team and build amazing products.</p>
        </body>
      </html>
    `;

    const result = await parseJobAd(html, { 
      sourceUrl: 'https://company.com/jobs/engineer' 
    });

    expect(result.motto).toBeUndefined();
    expect(result.mottoOrigin).toEqual({
      source: 'api_error',
      sourceUrl: 'https://company.com/jobs/engineer',
      confidence: 'low',
      extractedFrom: 'API request failed'
    });
  });

  it('should handle job parsing with no motto found', async () => {
    mockExtractMottoLLM.mockResolvedValue({
      motto: '-',
      found: false,
      reasoning: 'No clear company motto found in job posting',
      origin: {
        source: 'job_ad',
        sourceUrl: 'https://generic.com/jobs/developer',
        confidence: 'low',
        extractedFrom: 'No motto found in job posting'
      }
    });

    const html = `
      <html>
        <head><title>Developer</title></head>
        <body>
          <h1>Developer</h1>
          <div class="company">GenericCorp</div>
          <p>We need a developer. Apply now.</p>
        </body>
      </html>
    `;

    const result = await parseJobAd(html, { 
      sourceUrl: 'https://generic.com/jobs/developer' 
    });

    expect(result.motto).toBeUndefined();
    expect(result.mottoOrigin).toEqual({
      source: 'job_ad',
      sourceUrl: 'https://generic.com/jobs/developer',
      confidence: 'low',
      extractedFrom: 'No motto found in job posting'
    });
  });

  it('should preserve mottoOrigin in the final JobAdParsed type', async () => {
    mockExtractMottoLLM.mockResolvedValue({
      motto: 'Building the future',
      found: true,
      reasoning: 'Found company motto',
      origin: {
        source: 'job_ad',
        sourceUrl: 'https://future.com/jobs',
        confidence: 'medium',
        extractedFrom: 'Company values section'
      }
    });

    const html = `
      <html>
        <head><title>Future Builder</title></head>
        <body>
          <h1>Future Builder</h1>
          <div class="company">FutureCorp</div>
          <p>We are building the future.</p>
        </body>
      </html>
    `;

    const result: JobAdParsed = await parseJobAd(html, { 
      sourceUrl: 'https://future.com/jobs' 
    });

    // TypeScript should accept this assignment
    expect(result.mottoOrigin).toBeDefined();
    expect(result.mottoOrigin?.source).toBe('job_ad');
    expect(result.mottoOrigin?.confidence).toBe('medium');
    expect(result.mottoOrigin?.extractedFrom).toBe('Company values section');
  });
});
