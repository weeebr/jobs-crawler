import { NextRequest } from "next/server";
import { z } from "zod";
import { processJobSearchStream } from "@/lib/streaming/streamProcessor";
import { createErrorResponse } from "@/lib/streaming/streamUtils";
import { cvProfileSchema, type CVProfile } from "@/lib/schemas";

const streamRequestSchema = z.object({
  searchUrl: z.string().url('searchUrl must be a valid URL'),
  cv: cvProfileSchema.optional(),
  taskId: z.string().optional(),
  clearJobAdData: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = streamRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return createErrorResponse('Invalid request: ' + parsed.error.flatten().fieldErrors);
    }
    
    const { searchUrl, cv, taskId, clearJobAdData } = parsed.data;
    const stream = await processJobSearchStream(request, searchUrl, cv, taskId, clearJobAdData);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return createErrorResponse('Failed to process stream request');
  }
}

