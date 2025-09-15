import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { verifyAccountAuth } from '../../middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and get authorized account
    const authResult = await verifyAccountAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.errorCode || 401 }
      );
    }

    const { user, accountId } = authResult;
    console.log('[API] Update style for account:', accountId, 'user:', user.id);

    const supabase = createServiceRoleClient();

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