import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { sendAssignmentNotificationEmail } from '@/lib/email/assignmentNotification';

/**
 * PATCH /api/prompt-pages/assign
 * Assign or unassign a team member to a prompt page
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, assigned_to } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify prompt page belongs to this account
    const { data: page, error: pageError } = await supabaseAdmin
      .from('prompt_pages')
      .select('id, assigned_to, account_id, slug, first_name, last_name, client_name, contact_id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Prompt page not found' }, { status: 404 });
    }

    // No-op if same assignee
    const newAssignedTo = assigned_to || null;
    if (newAssignedTo === page.assigned_to) {
      return NextResponse.json({ success: true, noChange: true });
    }

    // Update assigned_to
    const { error: updateError } = await supabaseAdmin
      .from('prompt_pages')
      .update({
        assigned_to: newAssignedTo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating assignment:', updateError);
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
    }

    // Build activity content
    const getDisplayName = async (userId: string): Promise<string> => {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();
      if (profile?.first_name || profile?.last_name) {
        return [profile.first_name, profile.last_name].filter(Boolean).join(' ');
      }
      // Fallback to email
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = users?.find(u => u.id === userId);
      return authUser?.email || 'Unknown user';
    };

    let activityContent: string;
    if (newAssignedTo) {
      const assigneeName = await getDisplayName(newAssignedTo);
      activityContent = `Assigned to ${assigneeName}`;
    } else {
      activityContent = 'Unassigned';
    }

    // Log assignment_change activity in campaign_actions
    await supabaseAdmin
      .from('campaign_actions')
      .insert({
        prompt_page_id: id,
        contact_id: page.contact_id || null,
        account_id: accountId,
        activity_type: 'assignment_change',
        content: activityContent,
        metadata: {
          from: page.assigned_to,
          to: newAssignedTo,
        },
        created_by: user.id,
      });

    // Send email notification (fire-and-forget) if assigning someone other than self
    if (newAssignedTo && newAssignedTo !== user.id) {
      (async () => {
        try {
          const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
          const assigneeAuth = allUsers?.find(u => u.id === newAssignedTo);
          if (!assigneeAuth?.email) return;

          const { data: profiles } = await supabaseAdmin
            .from('user_profiles')
            .select('id, first_name, last_name')
            .in('id', [user.id, newAssignedTo]);

          const assignerProfile = profiles?.find(p => p.id === user.id);
          const assigneeProfile = profiles?.find(p => p.id === newAssignedTo);

          const assignerName = [assignerProfile?.first_name, assignerProfile?.last_name].filter(Boolean).join(' ')
            || user.email || 'A team member';
          const assigneeFirstName = assigneeProfile?.first_name || undefined;

          const itemTitle = [page.first_name, page.last_name].filter(Boolean).join(' ')
            || page.client_name
            || 'Unnamed page';

          const { data: biz } = await supabaseAdmin
            .from('businesses')
            .select('name')
            .eq('account_id', accountId)
            .limit(1)
            .single();

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';
          const itemUrl = `${appUrl}/prompt-pages?tab=campaign`;

          await sendAssignmentNotificationEmail({
            to: assigneeAuth.email,
            assigneeFirstName,
            assignerName,
            itemTitle,
            itemType: 'prompt page',
            itemUrl,
            businessName: biz?.name || undefined,
          });
        } catch (emailErr) {
          console.error('Failed to send prompt page assignment email:', emailErr);
        }
      })();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/prompt-pages/assign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
