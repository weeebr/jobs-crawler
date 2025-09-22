export interface StreamMessage {
  type: 'progress' | 'result' | 'error' | 'complete';
  data: any;
}

export function createSSEMessage(type: string, data: any): string {
  return `data: ${JSON.stringify({ type, data })}\n\n`;
}

export function createStreamResponse(message: string, status: number = 200) {
  return new Response(message, { 
    status,
    headers: { 'Content-Type': 'text/event-stream' }
  });
}

export function createErrorResponse(message: string) {
  return createStreamResponse(createSSEMessage('error', { message }), 400);
}
