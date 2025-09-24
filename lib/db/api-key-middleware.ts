import { NextRequest } from 'next/server';
import { getOrCreateUser, isValidApiKey, anonymizeApiKey } from './users';

/**
 * Extract API key from various sources in the request
 */
export function extractApiKey(request: NextRequest): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (isValidApiKey(token)) {
      return token;
    }
  }

  // Try x-api-key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader && isValidApiKey(apiKeyHeader)) {
    return apiKeyHeader;
  }

  // Try API key in request body (for POST requests)
  try {
    const body = request.body ? JSON.parse(request.body.toString()) : null;
    if (body?.apiKey && isValidApiKey(body.apiKey)) {
      return body.apiKey;
    }
  } catch {
    // Ignore JSON parsing errors
  }

  return null;
}

/**
 * Validate API key and get user context
 */
export async function validateApiKeyAndGetUser(request: NextRequest) {
  const apiKey = extractApiKey(request);

  if (!apiKey) {
    throw new Error('No valid API key provided. Please include it in Authorization header (Bearer token) or x-api-key header.');
  }

  try {
    const user = await getOrCreateUser(apiKey);
    return {
      user,
      apiKeyHash: user.apiKeyHash,
      userId: user.id,
    };
  } catch (error) {
    console.error('[api-key-middleware] Failed to validate API key:', error);
    throw new Error('Invalid API key provided.');
  }
}

/**
 * Create a request context with user information
 */
export async function createUserContext(request: NextRequest) {
  const userContext = await validateApiKeyAndGetUser(request);

  return {
    ...userContext,

    // Log anonymized API key for debugging
    logContext: {
      userId: userContext.userId,
      apiKeyPreview: anonymizeApiKey(request.headers.get('authorization')?.substring(7) ||
                                    request.headers.get('x-api-key') ||
                                    'unknown'),
    },
  };
}

/**
 * Wrapper for API handlers that need user context
 */
export async function withUserContext<T>(
  request: NextRequest,
  handler: (userContext: Awaited<ReturnType<typeof createUserContext>>) => Promise<T>
): Promise<T> {
  const userContext = await createUserContext(request);
  return handler(userContext);
}
