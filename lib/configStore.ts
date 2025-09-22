"use client";

export interface UserConfig {
  location: string;
  transportation: 'car' | 'public_transport';
  defaultJobSearchUrl: string;
  openaiApiKey: string;
  cvMarkdown: string;
}

const DEFAULT_CONFIG: UserConfig = {
  location: 'Alte Affolternstr. 18, 8908 Hedingen, Switzerland',
  transportation: 'public_transport',
  defaultJobSearchUrl: 'https://www.jobs.ch/en/vacancies/?term=frontend%20developer',
  openaiApiKey: '',
  cvMarkdown: ''
};

const CONFIG_KEY = 'jobs-crawler-config';

export function getConfig(): UserConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }

  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UserConfig;
      // Validate the stored config has all required fields
      if (parsed.location && parsed.transportation && parsed.defaultJobSearchUrl && parsed.openaiApiKey !== undefined && parsed.cvMarkdown !== undefined) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to parse stored config:', error);
  }

  return DEFAULT_CONFIG;
}

export function setConfig(config: Partial<UserConfig>): UserConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }

  try {
    const currentConfig = getConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    return newConfig;
  } catch (error) {
    console.warn('Failed to save config:', error);
    return getConfig();
  }
}

export function resetConfig(): UserConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }

  try {
    localStorage.removeItem(CONFIG_KEY);
    return DEFAULT_CONFIG;
  } catch (error) {
    console.warn('Failed to reset config:', error);
    return getConfig();
  }
}
