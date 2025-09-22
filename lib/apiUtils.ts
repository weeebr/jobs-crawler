import { NextResponse } from "next/server";
import { apiErrorResponseSchema, type ApiErrorResponse } from "./schemas";

/**
 * Centralized error response creation for API routes
 */
export function createApiErrorResponse(
  error: unknown, 
  status = 500,
  context?: string
): NextResponse<ApiErrorResponse> {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  
  if (context) {
    console.error(`[${context}] ${message}`);
  }
  
  const errorResponse: ApiErrorResponse = { error: message };
  
  // Validate the error response with Zod
  const validated = apiErrorResponseSchema.parse(errorResponse);
  
  return NextResponse.json(validated, { status });
}

/**
 * Centralized validation error response
 */
export function createValidationErrorResponse(
  error: any,
  context?: string
): NextResponse<ApiErrorResponse> {
  const message = "Invalid request";
  const details = error?.flatten?.() || error;
  
  if (context) {
    console.error(`[${context}] validation failed:`, details);
  }
  
  const errorResponse: ApiErrorResponse = { 
    error: message, 
    details 
  };
  
  return NextResponse.json(errorResponse, { status: 400 });
}

/**
 * Centralized success response creation
 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Centralized error message extraction for consistent error handling
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return "Unknown error occurred";
}

/**
 * Centralized error logging with context
 */
export function logError(error: unknown, context: string, additionalInfo?: Record<string, any>): void {
  const message = extractErrorMessage(error);
  const errorType = error instanceof Error ? error.constructor.name : 'Unknown';
  
  console.error(`[${context}] ${message}`, {
    errorType,
    ...additionalInfo
  });
}
