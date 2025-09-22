import { describe, it, expect } from 'vitest';
import { jobAdFetchedSchema } from '../schemas';

describe('mottoOrigin schema validation', () => {
  it('should validate jobAdFetched with mottoOrigin', () => {
    const validJobAd = {
      title: 'Senior Developer',
      company: 'TechCorp',
      stack: ['React', 'TypeScript'],
      qualifications: ['5+ years experience'],
      roles: ['Develop applications'],
      benefits: ['Competitive salary'],
      sourceUrl: 'https://example.com/job',
      jobUrl: 'https://example.com/job',
      size: '50' as const,
      motto: 'Innovation through technology',
      mottoOrigin: {
        source: 'job_ad' as const,
        sourceUrl: 'https://example.com/job',
        confidence: 'high' as const,
        extractedFrom: 'LLM analysis of job posting'
      },
      publishedAt: '2024-01-01',
      location: 'Remote',
      workload: 'Full-time',
      duration: 'Permanent',
      language: 'English',
      fetchedAt: Date.now(),
      sourceDomain: 'example.com'
    };

    const result = jobAdFetchedSchema.safeParse(validJobAd);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mottoOrigin).toEqual({
        source: 'job_ad',
        sourceUrl: 'https://example.com/job',
        confidence: 'high',
        extractedFrom: 'LLM analysis of job posting'
      });
    }
  });

  it('should validate jobAdFetched with all mottoOrigin source types', () => {
    const sources = ['job_ad', 'company_page', 'fallback', 'api_error'] as const;
    const confidences = ['high', 'medium', 'low'] as const;

    for (const source of sources) {
      for (const confidence of confidences) {
        const jobAd = {
          title: 'Senior Developer',
          company: 'TechCorp',
          stack: [],
          qualifications: [],
          roles: [],
          benefits: [],
          motto: 'Test motto',
          mottoOrigin: {
            source,
            confidence,
            extractedFrom: 'Test extraction'
          },
          fetchedAt: Date.now()
        };

        const result = jobAdFetchedSchema.safeParse(jobAd);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.mottoOrigin?.source).toBe(source);
          expect(result.data.mottoOrigin?.confidence).toBe(confidence);
        }
      }
    }
  });

  it('should validate jobAdFetched without mottoOrigin', () => {
    const jobAd = {
      title: 'Senior Developer',
      company: 'TechCorp',
      stack: [],
      qualifications: [],
      roles: [],
      benefits: [],
      motto: 'Test motto',
      // No mottoOrigin
      fetchedAt: Date.now()
    };

    const result = jobAdFetchedSchema.safeParse(jobAd);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mottoOrigin).toBeUndefined();
    }
  });

  it('should reject invalid mottoOrigin source', () => {
    const jobAd = {
      title: 'Senior Developer',
      company: 'TechCorp',
      stack: [],
      qualifications: [],
      roles: [],
      benefits: [],
      motto: 'Test motto',
      mottoOrigin: {
        source: 'invalid_source' as any,
        confidence: 'high' as const,
        extractedFrom: 'Test extraction'
      },
      fetchedAt: Date.now()
    };

    const result = jobAdFetchedSchema.safeParse(jobAd);
    expect(result.success).toBe(false);
  });

  it('should reject invalid mottoOrigin confidence', () => {
    const jobAd = {
      title: 'Senior Developer',
      company: 'TechCorp',
      stack: [],
      qualifications: [],
      roles: [],
      benefits: [],
      motto: 'Test motto',
      mottoOrigin: {
        source: 'job_ad' as const,
        confidence: 'invalid_confidence' as any,
        extractedFrom: 'Test extraction'
      },
      fetchedAt: Date.now()
    };

    const result = jobAdFetchedSchema.safeParse(jobAd);
    expect(result.success).toBe(false);
  });

  it('should accept mottoOrigin with optional fields', () => {
    const jobAd = {
      title: 'Senior Developer',
      company: 'TechCorp',
      stack: [],
      qualifications: [],
      roles: [],
      benefits: [],
      motto: 'Test motto',
      mottoOrigin: {
        source: 'job_ad' as const,
        confidence: 'high' as const
        // No sourceUrl or extractedFrom
      },
      fetchedAt: Date.now()
    };

    const result = jobAdFetchedSchema.safeParse(jobAd);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mottoOrigin?.sourceUrl).toBeUndefined();
      expect(result.data.mottoOrigin?.extractedFrom).toBeUndefined();
    }
  });

  it('should accept mottoOrigin with all optional fields', () => {
    const jobAd = {
      title: 'Senior Developer',
      company: 'TechCorp',
      stack: [],
      qualifications: [],
      roles: [],
      benefits: [],
      motto: 'Test motto',
      mottoOrigin: {
        source: 'job_ad' as const,
        sourceUrl: 'https://example.com/job',
        confidence: 'high' as const,
        extractedFrom: 'LLM analysis of job posting'
      },
      fetchedAt: Date.now()
    };

    const result = jobAdFetchedSchema.safeParse(jobAd);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mottoOrigin?.sourceUrl).toBe('https://example.com/job');
      expect(result.data.mottoOrigin?.extractedFrom).toBe('LLM analysis of job posting');
    }
  });
});
