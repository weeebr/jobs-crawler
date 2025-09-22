import { loadDefaultCv } from "./defaultCv";

export interface CvSource {
  markdown: string;
  source: 'env' | 'file' | 'user';
}

/**
 * Loads CV markdown from various sources with priority:
 * 1. User-provided CV from settings
 * 2. CV from .env file (if CV_MARKDOWN is set)
 * 3. Default CV from file system
 */
export async function loadCvFromSources(userCvMarkdown?: string): Promise<CvSource> {
  // Priority 1: User-provided CV from settings
  if (userCvMarkdown && userCvMarkdown.trim()) {
    return {
      markdown: userCvMarkdown,
      source: 'user'
    };
  }

  // Priority 2: CV from .env file
  if (typeof process !== 'undefined' && process.env.CV_MARKDOWN) {
    return {
      markdown: process.env.CV_MARKDOWN,
      source: 'env'
    };
  }

  // Priority 3: Default CV from file system
  try {
    const defaultCv = await loadDefaultCv();
    return {
      markdown: defaultCv.markdown,
      source: 'file'
    };
  } catch (error) {
    console.warn('Failed to load default CV:', error);
    return {
      markdown: '',
      source: 'file'
    };
  }
}

/**
 * Loads CV markdown for client-side usage
 * This function works in the browser and loads from localStorage
 */
export function loadCvFromClient(): CvSource {
  if (typeof window === 'undefined') {
    return { markdown: '', source: 'file' };
  }

  try {
    const config = localStorage.getItem('jobs-crawler-config');
    if (config) {
      const parsed = JSON.parse(config);
      if (parsed.cvMarkdown && parsed.cvMarkdown.trim()) {
        return {
          markdown: parsed.cvMarkdown,
          source: 'user'
        };
      }
    }
  } catch (error) {
    console.warn('Failed to load CV from client storage:', error);
  }

  return { markdown: '', source: 'file' };
}
