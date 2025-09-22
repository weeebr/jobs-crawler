/**
 * Centralized retry logic with exponential backoff
 */
export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 500,
    maxDelayMs = 2000,
    onRetry
  } = options;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate exponential backoff delay
      const delayMs = Math.min(
        baseDelayMs * Math.pow(2, attempt),
        maxDelayMs
      );
      
      if (onRetry) {
        onRetry(attempt + 1, error);
      }
      
      console.info(`[retryUtils] retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
}

/**
 * Centralized timeout handling
 */
export function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = "Operation timed out"
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ]);
}

/**
 * Centralized abort signal checking
 */
export function checkAbortSignal(signal?: AbortSignal, context = "operation"): void {
  if (signal?.aborted) {
    throw new Error(`${context} aborted`);
  }
}
