import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getPendingReminders } from '@/utils/communication';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the proper account ID using the header and validate access
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found or access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (contactId) {
      // Get reminders for specific contact (with account filter)
      const { data: reminders, error } = await supabase
        .from('follow_up_reminders')
        .select(`
          *,
          communication_records!inner (
            id,
            communication_type,
            subject,
            message_content,
            sent_at
          )
        `)
        .eq('contact_id', contactId)
        .eq('account_id', accountId)
        .eq('status', 'pending')
        .lte('reminder_date', new Date().toISOString())
        .order('reminder_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching contact reminders:', error);
        return NextResponse.json(
          { error: 'Failed to fetch reminders' },
          { status: 500 }
        );
      }

      return NextResponse.json({ reminders: reminders || [] }, { status: 200 });
    } else {
      // Get all pending reminders for account
      const reminders = await getPendingReminders(accountId, limit);
      return NextResponse.json({ reminders }, { status: 200 });
    }

  } catch (error: any) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the proper account ID using the header and validate access
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found or access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reminderId, action } = body;

    if (!reminderId || !action) {
      return NextResponse.json(
        { error: 'reminderId and action are required' },
        { status: 400 }
      );
    }

    if (!['complete', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "complete" or "cancel"' },
        { status: 400 }
      );
    }

    const newStatus = action === 'complete' ? 'completed' : 'cancelled';

    // Update the reminder status (with account filter for security)
    const { data: updatedReminder, error: updateError } = await supabase
      .from('follow_up_reminders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', reminderId)
      .eq('account_id', accountId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating reminder:', updateError);
      return NextResponse.json(
        { error: 'Failed to update reminder' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      reminder: updatedReminder,
      action: newStatus
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update reminder' },
      { status: 500 }
    );
  }
}