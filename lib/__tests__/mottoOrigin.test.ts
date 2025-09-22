import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractMottoLLM, type MottoExtractionResult } from '../jobAd/metadata/mottoLLM';

// Mock the fallback import
vi.mock('../jobAd/metadata/sizeAndMotto', () => ({
  extractMotto: vi.fn().mockReturnValue('Innovation through technology'),
}));

describe('extractMottoLLM with origin tracking', () => {
  const originalEnv = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalEnv;
  });

  describe('fallback scenario (no API key)', () => {
    it('should return origin information when using fallback', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await extractMottoLLM(
        'We believe in innovation and collaboration',
        'Test Company',
        'https://example.com/job'
      );

      expect(result).toEqual({
        motto: '-',
        found: false,
        reasoning: 'No API key available - motto extraction skipped',
        origin: {
          source: 'fallback',
          sourceUrl: 'https://example.com/job',
          confidence: 'low',
          extractedFrom: 'API key not available'
        }
      });
    });

    it('should return origin information when fallback finds no motto', async () => {
      delete process.env.OPENAI_API_KEY;
      
      // Mock extractMotto to return undefined
      const { extractMotto } = await import('../jobAd/metadata/sizeAndMotto');
      vi.mocked(extractMotto).mockReturnValue(undefined);

      const result = await extractMottoLLM(
        'Just a regular job posting',
        'Test Company',
        'https://example.com/job'
      );

      expect(result).toEqual({
        motto: '-',
        found: false,
        reasoning: 'No API key available - motto extraction skipped',
        origin: {
          source: 'fallback',
          sourceUrl: 'https://example.com/job',
          confidence: 'low',
          extractedFrom: 'API key not available'
        }
      });
    });
  });

  describe('API error scenarios', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key';
    });

    it('should return origin information for API errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      const result = await extractMottoLLM(
        'We believe in innovation',
        'Test Company',
        'https://example.com/job'
      );

      expect(result).toEqual({
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
    });

    it('should return origin information for empty API responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '' } }]
        })
      });

      const result = await extractMottoLLM(
        'We believe in innovation',
        'Test Company',
        'https://example.com/job'
      );

      expect(result).toEqual({
        motto: '-',
        found: false,
        reasoning: 'No content in API response',
        origin: {
          source: 'api_error',
          sourceUrl: 'https://example.com/job',
          confidence: 'low',
          extractedFrom: 'Empty API response'
        }
      });
    });

    it('should return origin information for JSON parsing errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'invalid json {' } }]
        })
      });

      const result = await extractMottoLLM(
        'We believe in innovation',
        'Test Company',
        'https://example.com/job'
      );

      expect(result).toEqual({
        motto: '-',
        found: false,
        reasoning: 'Failed to parse JSON response',
        origin: {
          source: 'api_error',
          sourceUrl: 'https://example.com/job',
          confidence: 'low',
          extractedFrom: 'Invalid JSON response'
        }
      });
    });

    it('should return origin information for schema validation errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '{"invalid": "format"}' } }]
        })
      });

      const result = await extractMottoLLM(
        'We believe in innovation',
        'Test Company',
        'https://example.com/job'
      );

      expect(result).toEqual({
        motto: '-',
        found: false,
        reasoning: 'Invalid response format',
        origin: {
          source: 'api_error',
          sourceUrl: 'https://example.com/job',
          confidence: 'low',
          extractedFrom: 'Schema validation failed'
        }
      });
    });
  });

  describe('successful API scenarios', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key';
    });

    it('should return origin information for successful motto extraction', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ 
            message: { 
              content: JSON.stringify({
                motto: 'Innovation through technology',
                result: true,
                reasoning: 'Found clear company motto in job posting'
              })
            } 
          }]
        })
      });

      const result = await extractMottoLLM(
        'We believe in innovation and creating meaningful impact through technology',
        'Test Company',
        'https://example.com/job'
      );

      expect(result).toEqual({
        motto: 'Innovation through technology',
        found: true,
        reasoning: 'Found clear company motto in job posting',
        origin: {
          source: 'job_ad',
          sourceUrl: 'https://example.com/job',
          confidence: 'high',
          extractedFrom: 'LLM analysis of job posting'
        }
      });
    });

    it('should return origin information when no motto is found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ 
            message: { 
              content: JSON.stringify({
                motto: '-',
                result: false,
                reasoning: 'No clear company motto found in job posting'
              })
            } 
          }]
        })
      });

      const result = await extractMottoLLM(
        'Just a regular job posting with no company values',
        'Test Company',
        'https://example.com/job'
      );

      expect(result).toEqual({
        motto: '-',
        found: false,
        reasoning: 'No clear company motto found in job posting',
        origin: {
          source: 'job_ad',
          sourceUrl: 'https://example.com/job',
          confidence: 'low',
          extractedFrom: 'No motto found in job posting'
        }
      });
    });
  });

  describe('exception handling', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key';
    });

    it('should return origin information for exceptions', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await extractMottoLLM(
        'We believe in innovation',
        'Test Company',
        'https://example.com/job'
      );

      expect(result).toEqual({
        motto: '-',
        found: false,
        reasoning: 'Error: Network error',
        origin: {
          source: 'api_error',
          sourceUrl: 'https://example.com/job',
          confidence: 'low',
          extractedFrom: 'Exception during processing'
        }
      });
    });
  });
});
