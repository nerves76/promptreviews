import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { getBalance, debit, InsufficientCreditsError } from '@/lib/credits';

interface BulkScheduleRequestBody {
  postIds: string[];
  startDate: string; // YYYY-MM-DD
  intervalDays: number;
  timezone: string;
  skipConflicts?: boolean;
}

interface ScheduleAssignment {
  postId: string;
  assignedDate: string;
  skippedDates?: string[];
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function todayUtc(): string {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkScheduleRequestBody = await request.json();

    const { postIds, startDate, intervalDays, timezone, skipConflicts = true } = body;

    // Validation
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one post ID is required' },
        { status: 400 }
      );
    }

    if (!startDate || !isDateString(startDate)) {
      return NextResponse.json(
        { success: false, error: 'startDate must be provided in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    if (startDate < todayUtc()) {
      return NextResponse.json(
        { success: false, error: 'startDate must not be in the past' },
        { status: 400 }
      );
    }

    if (!intervalDays || intervalDays < 1 || intervalDays > 365) {
      return NextResponse.json(
        { success: false, error: 'intervalDays must be between 1 and 365' },
        { status: 400 }
      );
    }

    if (!timezone) {
      return NextResponse.json(
        { success: false, error: 'timezone is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Unable to resolve account.' },
        { status: 400 }
      );
    }

    // 1. Fetch the draft posts by IDs
    const { data: drafts, error: draftsError } = await supabase
      .from('google_business_scheduled_posts')
      .select('id, status, selected_locations')
      .eq('account_id', accountId)
      .eq('status', 'draft')
      .in('id', postIds);

    if (draftsError) {
      console.error('[BulkSchedule] Failed to fetch drafts:', draftsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch draft posts.' },
        { status: 500 }
      );
    }

    if (!drafts || drafts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid draft posts found for the provided IDs.' },
        { status: 400 }
      );
    }

    // Check credit balance (1 credit per post)
    const balance = await getBalance(supabase, accountId);
    if (balance.totalCredits < drafts.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient credits. You need ${drafts.length} credits but have ${balance.totalCredits}.`
        },
        { status: 402 }
      );
    }

    // 2. Fetch existing scheduled posts to find conflicts
    let conflictDates: Set<string> = new Set();

    if (skipConflicts) {
      const { data: existingPosts } = await supabase
        .from('google_business_scheduled_posts')
        .select('scheduled_date')
        .eq('account_id', accountId)
        .in('status', ['pending', 'processing'])
        .not('scheduled_date', 'is', null);

      if (existingPosts) {
        existingPosts.forEach((post) => {
          if (post.scheduled_date) {
            conflictDates.add(post.scheduled_date);
          }
        });
      }
    }

    // 3. Assign dates, skipping conflicts
    const assignments: ScheduleAssignment[] = [];
    let currentDate = startDate;
    const orderedPostIds = postIds.filter((id) => drafts.some((d) => d.id === id));

    for (const postId of orderedPostIds) {
      const skippedDates: string[] = [];

      // Find next available date
      while (skipConflicts && conflictDates.has(currentDate)) {
        skippedDates.push(currentDate);
        currentDate = addDays(currentDate, 1);
      }

      assignments.push({
        postId,
        assignedDate: currentDate,
        skippedDates: skippedDates.length > 0 ? skippedDates : undefined,
      });

      // Mark this date as now used
      conflictDates.add(currentDate);

      // Move to next interval
      currentDate = addDays(currentDate, intervalDays);
    }

    // 4. Update each draft to pending with assigned date
    const updatePromises = assignments.map(async (assignment) => {
      const { error: updateError } = await supabase
        .from('google_business_scheduled_posts')
        .update({
          status: 'pending',
          scheduled_date: assignment.assignedDate,
          timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignment.postId)
        .eq('account_id', accountId);

      if (updateError) {
        console.error(`[BulkSchedule] Failed to update post ${assignment.postId}:`, updateError);
        return { postId: assignment.postId, success: false, error: updateError.message };
      }

      // Debit credit for this post
      const idempotencyKey = `bulk_schedule:${assignment.postId}`;
      try {
        await debit(supabase, accountId, 1, {
          featureType: 'scheduled_post',
          idempotencyKey,
          featureMetadata: {
            postId: assignment.postId,
            scheduledDate: assignment.assignedDate,
            source: 'bulk_schedule',
          },
        });
      } catch (creditError) {
        if (creditError instanceof InsufficientCreditsError) {
          console.error('[BulkSchedule] Credit debit failed - insufficient credits:', creditError);
        } else {
          // Idempotency errors are OK - post was already charged
          console.log('[BulkSchedule] Credit debit idempotency check:', creditError);
        }
      }

      return { postId: assignment.postId, success: true };
    });

    const results = await Promise.all(updatePromises);
    const failures = results.filter((r) => !r.success);

    if (failures.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Failed to schedule ${failures.length} posts.`,
        data: { assignments, failures },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        scheduledCount: assignments.length,
        assignments,
        creditsUsed: assignments.length,
      },
    });
  } catch (error) {
    console.error('[BulkSchedule] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected error while bulk scheduling.' },
      { status: 500 }
    );
  }
}
