import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

const VALID_STATUSES = ['draft', 'in_queue', 'sent', 'follow_up', 'complete'];

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current user (more reliable than getSession for server routes)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error in prompt-pages/update-status:', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status } = body;

    // Validate required fields
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Both id and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user's account ID
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'No account found for user' },
        { status: 404 }
      );
    }

    // First, verify the user owns this prompt page
    const { data: existingPage, error: fetchError } = await supabase
      .from('prompt_pages')
      .select('id, account_id, status')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (fetchError || !existingPage) {
      return NextResponse.json(
        { error: 'Prompt page not found or access denied' },
        { status: 404 }
      );
    }

    // Update the prompt page status
    const { data: updatedPage, error: updateError } = await supabase
      .from('prompt_pages')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('account_id', accountId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating prompt page status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update prompt page status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      promptPage: updatedPage,
      previousStatus: existingPage.status
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating prompt page status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update prompt page status' },
      { status: 500 }
    );
  }
}