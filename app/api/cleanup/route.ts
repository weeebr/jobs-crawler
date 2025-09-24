import { NextRequest, NextResponse } from 'next/server';
import { cleanupInvalidTimestamps } from '@/lib/analysisStorageCleanup';

export async function GET(request: NextRequest) {
  try {
    // Only allow this in development or with proper authentication
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Cleanup only available in development' }, { status: 403 });
    }

    await cleanupInvalidTimestamps();

    return NextResponse.json({
      success: true,
      message: 'Database cleanup completed successfully'
    });
  } catch (error) {
    console.error('[cleanup] Error:', error);
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
