import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createBackgroundTask,
  listActiveTasks,
  listAllTasks,
  cancelTask,
  cleanupOldTasks
} from "@/lib/backgroundTasks";
import { startBackgroundTaskProcessor } from "@/lib/backgroundTaskProcessor";
import { taskResponseSchema, type TaskResponse } from "@/lib/schemas";

const taskQuerySchema = z.object({
  active: z.string().optional(),
  limit: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get query parameters safely - handle null values
  const activeParam = searchParams.get('active');
  const limitParam = searchParams.get('limit');

  // Only validate if parameters are actually provided
  if (activeParam !== null || limitParam !== null) {
    const queryResult = taskQuerySchema.safeParse({
      active: activeParam,
      limit: limitParam,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }
  }

  const active = activeParam === 'true';
  const limit = parseInt(limitParam || '50', 10);

  try {
    const tasks = active ? listActiveTasks() : listAllTasks(limit);
    const response: TaskResponse = { tasks };

    // Validate response before sending
    const validatedResponse = taskResponseSchema.parse(response);
    return NextResponse.json(validatedResponse);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

const createTaskRequestSchema = z.object({
  searchUrl: z.string().url('searchUrl must be a valid URL'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createTaskRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    
    const { searchUrl } = parsed.data;
    const task = createBackgroundTask(searchUrl);

    // Start the background processor
    startBackgroundTaskProcessor(task.id);

    // Validate task before sending
    const validatedTask = taskResponseSchema.parse({ tasks: [task] });
    return NextResponse.json(validatedTask);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('id');
  const cleanup = searchParams.get('cleanup') === 'true';

  try {
    if (cleanup) {
      const cleaned = cleanupOldTasks();
      return NextResponse.json({ cleaned });
    }

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const cancelled = cancelTask(taskId);
    if (!cancelled) {
      return NextResponse.json(
        { error: 'Task not found or not running' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to cancel task' },
      { status: 500 }
    );
  }
}
