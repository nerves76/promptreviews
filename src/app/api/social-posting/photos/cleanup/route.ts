/**
 * API endpoint for cleaning up old Google Business Profile media upload records
 * Removes metadata records older than 30 days to keep the database clean
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting Google Business Profile media uploads cleanup...');

    // Verify this is an internal/cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Delete records older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: deletedRecords, error } = await supabase
      .from('google_business_media_uploads')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id');

    if (error) {
      console.error('❌ Failed to cleanup old records:', error);
      return NextResponse.json(
        { success: false, message: 'Cleanup failed', error: error.message },
        { status: 500 }
      );
    }

    const deletedCount = deletedRecords?.length || 0;
    console.log(`✅ Cleanup completed: ${deletedCount} old records removed`);

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      deletedCount
    });

  } catch (error) {
    console.error('🧹 Cleanup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
} 