"use client";

import { getConfig } from "./configStore";

export async function validateApiKey(): Promise<{ isValid: boolean; errorMessage?: string }> {
  // Check if API key is available in user config (client-side)
  const config = getConfig();
  const storedApiKey = config.openaiApiKey;
  
  // If user has configured API key in settings, use that
  if (typeof storedApiKey === 'string' && storedApiKey.trim()) {
    return { isValid: true };
  }
  
  // Check if API key is available in environment variables (server-side)
  try {
    const response = await fetch('/api/cv/env');
    const data = await response.json();
    
    if (data.hasEnvApiKey) {
      return { isValid: true };
    }
  } catch (error) {
    console.warn('Failed to check environment API key:', error);
  }
  
  // API key is missing from both sources
  return {
    isValid: false,
    errorMessage: "OpenAI API key is required for job analysis. Please configure your API key in the settings or environment variables."
  };
}

export async function checkApiKeyAndThrow(): Promise<void> {
  const { isValid, errorMessage } = await validateApiKey();
  if (!isValid) {
    throw new Error(errorMessage);
  }
}
