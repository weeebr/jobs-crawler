import { describe, it, expect } from 'vitest';
import type { AnalysisRecord } from '../types';
import type { JobAdFetched } from '../schemas';

describe('mottoOrigin UI compatibility', () => {
  it('should handle AnalysisRecord with mottoOrigin', () => {
    const mockJob: JobAdFetched = {
      title: 'Senior Developer',
      company: 'TechCorp',
      stack: ['React', 'TypeScript'],
      qualifications: ['5+ years experience'],
      roles: ['Develop applications'],
      benefits: ['Competitive salary'],
      sourceUrl: 'https://example.com/job',
      jobUrl: 'https://example.com/job',
      size: '50',
      motto: 'Innovation through technology',
      mottoOrigin: {
        source: 'job_ad',
        sourceUrl: 'https://example.com/job',
        confidence: 'high',
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

    const mockAnalysisRecord: AnalysisRecord = {
      id: 1,
      job: mockJob,
      cv: {
        roles: [],
        skills: [],
        projects: [],
        education: [],
        keywords: []
      },
      llmAnalysis: {
        matchScore: 85,
        reasoning: ['Strong technical match'],
        letters: {},
        analyzedAt: Date.now(),
        analysisVersion: '1.0'
      },
      userInteractions: {
        status: 'interested',
        notes: 'Great opportunity',
        lastViewedAt: Date.now(),
        interactionCount: 1
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Verify the mottoOrigin is accessible in the job data
    expect(mockAnalysisRecord.job.mottoOrigin).toBeDefined();
    expect(mockAnalysisRecord.job.mottoOrigin?.source).toBe('job_ad');
    expect(mockAnalysisRecord.job.mottoOrigin?.confidence).toBe('high');
    expect(mockAnalysisRecord.job.mottoOrigin?.extractedFrom).toBe('LLM analysis of job posting');
    expect(mockAnalysisRecord.job.mottoOrigin?.sourceUrl).toBe('https://example.com/job');
  });

  it('should handle AnalysisRecord without mottoOrigin', () => {
    const mockJob: JobAdFetched = {
      title: 'Senior Developer',
      company: 'TechCorp',
      stack: ['React', 'TypeScript'],
      qualifications: ['5+ years experience'],
      roles: ['Develop applications'],
      benefits: ['Competitive salary'],
      sourceUrl: 'https://example.com/job',
      jobUrl: 'https://example.com/job',
      size: '50',
      motto: 'Innovation through technology',
      // No mottoOrigin
      publishedAt: '2024-01-01',
      location: 'Remote',
      workload: 'Full-time',
      duration: 'Permanent',
      language: 'English',
      fetchedAt: Date.now(),
      sourceDomain: 'example.com'
    };

    const mockAnalysisRecord: AnalysisRecord = {
      id: 1,
      job: mockJob,
      cv: {
        roles: [],
        skills: [],
        projects: [],
        education: [],
        keywords: []
      },
      llmAnalysis: {
        matchScore: 85,
        reasoning: ['Strong technical match'],
        letters: {},
        analyzedAt: Date.now(),
        analysisVersion: '1.0'
      },
      userInteractions: {
        status: 'interested',
        notes: 'Great opportunity',
        lastViewedAt: Date.now(),
        interactionCount: 1
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Verify the mottoOrigin is undefined
    expect(mockAnalysisRecord.job.mottoOrigin).toBeUndefined();
  });

  it('should handle all mottoOrigin source types', () => {
    const sources = ['job_ad', 'company_page', 'fallback', 'api_error'] as const;
    const confidences = ['high', 'medium', 'low'] as const;

    for (const source of sources) {
      for (const confidence of confidences) {
        const mockJob: JobAdFetched = {
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

        const mockAnalysisRecord: AnalysisRecord = {
          id: 1,
          job: mockJob,
          cv: {
            roles: [],
            skills: [],
            projects: [],
            education: [],
            keywords: []
          },
          llmAnalysis: {
            matchScore: 85,
            reasoning: ['Strong technical match'],
            letters: {},
            analyzedAt: Date.now(),
            analysisVersion: '1.0'
          },
          userInteractions: {
            status: 'interested',
            notes: 'Great opportunity',
            lastViewedAt: Date.now(),
            interactionCount: 1
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        // Verify the mottoOrigin is accessible
        expect(mockAnalysisRecord.job.mottoOrigin?.source).toBe(source);
        expect(mockAnalysisRecord.job.mottoOrigin?.confidence).toBe(confidence);
      }
    }
  });

  it('should handle mottoOrigin with optional fields', () => {
    const mockJob: JobAdFetched = {
      title: 'Senior Developer',
      company: 'TechCorp',
      stack: [],
      qualifications: [],
      roles: [],
      benefits: [],
      motto: 'Test motto',
      mottoOrigin: {
        source: 'job_ad',
        confidence: 'high'
        // No sourceUrl or extractedFrom
      },
      fetchedAt: Date.now()
    };

    const mockAnalysisRecord: AnalysisRecord = {
      id: 1,
      job: mockJob,
      cv: {
        roles: [],
        skills: [],
        projects: [],
        education: [],
        keywords: []
      },
      llmAnalysis: {
        matchScore: 85,
        reasoning: ['Strong technical match'],
        letters: {},
        analyzedAt: Date.now(),
        analysisVersion: '1.0'
      },
      userInteractions: {
        status: 'interested',
        notes: 'Great opportunity',
        lastViewedAt: Date.now(),
        interactionCount: 1
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Verify the mottoOrigin is accessible with optional fields
    expect(mockAnalysisRecord.job.mottoOrigin?.source).toBe('job_ad');
    expect(mockAnalysisRecord.job.mottoOrigin?.confidence).toBe('high');
    expect(mockAnalysisRecord.job.mottoOrigin?.sourceUrl).toBeUndefined();
    expect(mockAnalysisRecord.job.mottoOrigin?.extractedFrom).toBeUndefined();
  });
});
