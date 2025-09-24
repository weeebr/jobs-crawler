import { NextRequest, NextResponse } from "next/server";
import { getTaskById } from "@/lib/backgroundTasks";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const task = getTaskById(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      taskId,
      status: task.status,
      progress: task.progress,
      resultsCount: task.results.length,
      errorsCount: task.errors.length,
      completed: task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'
    });
  } catch (error) {
    console.error('[api/tasks/progress] error:', error);
    return NextResponse.json(
      { error: 'Failed to get task progress' },
      { status: 500 }
    );
  }
}
