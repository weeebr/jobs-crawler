/**
 * Development console warning suppression
 * Suppresses known development warnings that don't affect functionality
 */

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Store original console methods
  const originalWarn = console.warn;
  const originalError = console.error;

  // Suppress CSS preload warnings in development
  console.warn = (...args: any[]) => {
    const message = args[0];
    
    // Suppress CSS preload warnings
    if (typeof message === 'string' && 
        message.includes('was preloaded using link preload but not used within a few seconds')) {
      return; // Suppress this warning
    }
    
    // Allow other warnings through
    originalWarn.apply(console, args);
  };

  // Suppress specific development errors that are known to be harmless
  console.error = (...args: any[]) => {
    const message = args[0];
    
    // Suppress specific development errors
    if (typeof message === 'string' && 
        (message.includes('preload') || 
         message.includes('CSS') ||
         message.includes('stylesheet'))) {
      return; // Suppress these errors
    }
    
    // Allow other errors through
    originalError.apply(console, args);
  };
}

export {};
