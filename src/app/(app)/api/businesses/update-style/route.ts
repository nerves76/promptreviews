import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get selected account from cookie
    const cookieStore = cookies();
    const selectedAccountCookie = cookieStore.get('selected_account');

    if (!selectedAccountCookie?.value) {
      return NextResponse.json({ error: 'No account selected' }, { status: 400 });
    }

    const accountId = selectedAccountCookie.value;
    console.log('[API] Update style for account:', accountId, 'user:', user.id);

    // Verify user has access to this account
    const { data: accountUser, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single();

    if (accessError || !accountUser) {
      console.error('[API] Access denied:', accessError);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse the style update from request body
    const body = await request.json();
    const { businessId, ...styleUpdate } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    // Verify the business belongs to the selected account
    const { data: business, error: bizCheckError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('account_id', accountId)
      .single();

    if (bizCheckError || !business) {
      console.error('[API] Business not found or access denied:', bizCheckError);
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    console.log('[API] Updating business:', businessId, 'with styles:', styleUpdate);

    // Update the business with new style settings
    const { error: updateError } = await supabase
      .from('businesses')
      .update(styleUpdate)
      .eq('id', businessId)
      .eq('account_id', accountId); // Double-check for security

    if (updateError) {
      console.error('[API] Update error:', updateError);
      return NextResponse.json({
        error: 'Failed to update styles',
        details: updateError.message
      }, { status: 500 });
    }

    console.log('[API] Successfully updated styles for business:', businessId);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}