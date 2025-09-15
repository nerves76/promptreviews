import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { verifyAccountAuth } from '../../middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Log incoming headers for debugging
    const selectedAccountHeader = request.headers.get('x-selected-account');
    console.log('[API/update-style] Incoming X-Selected-Account header:', selectedAccountHeader);

    // Verify authentication and get authorized account
    const authResult = await verifyAccountAuth(request);
    console.log('[API/update-style] Auth result:', {
      success: authResult.success,
      accountId: authResult.accountId,
      userId: authResult.user?.id,
      error: authResult.error
    });

    if (!authResult.success) {
      console.error('[API/update-style] Auth failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.errorCode || 401 }
      );
    }

    const { user, accountId } = authResult;
    console.log('[API/update-style] Update style for account:', accountId, 'user:', user.id);

    const supabase = createServiceRoleClient();

    // Parse the style update from request body
    const body = await request.json();
    const { businessId, ...styleUpdate } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    // Verify the business belongs to the selected account
    console.log('[API/update-style] Checking business:', businessId, 'for account:', accountId);
    const { data: business, error: bizCheckError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('account_id', accountId)
      .single();

    if (bizCheckError || !business) {
      console.error('[API/update-style] Business not found or access denied:', {
        businessId,
        accountId,
        error: bizCheckError?.message,
        code: bizCheckError?.code
      });
      return NextResponse.json({ error: 'Business not found or access denied' }, { status: 404 });
    }

    // Log specific gradient values being updated
    console.log('[API/update-style] Gradient values to update:', {
      gradient_start: styleUpdate.gradient_start,
      gradient_middle: styleUpdate.gradient_middle,
      gradient_end: styleUpdate.gradient_end,
      background_type: styleUpdate.background_type
    });

    console.log('[API/update-style] Full update payload:', JSON.stringify(styleUpdate, null, 2));

    // Update the business with new style settings
    const { data: updateData, error: updateError, count } = await supabase
      .from('businesses')
      .update(styleUpdate)
      .eq('id', businessId)
      .eq('account_id', accountId) // Double-check for security
      .select();

    console.log('[API/update-style] Update result:', {
      error: updateError,
      dataReturned: updateData?.length || 0,
      count: count
    });

    if (updateError) {
      console.error('[API/update-style] Update error:', updateError);
      return NextResponse.json({
        error: 'Failed to update styles',
        details: updateError.message
      }, { status: 500 });
    }

    // Verify the update by reading back
    const { data: verifyData, error: verifyError } = await supabase
      .from('businesses')
      .select('background_type, background_color, gradient_start, gradient_middle, gradient_end')
      .eq('id', businessId)
      .single();

    console.log('[API/update-style] Verification read:', {
      businessId,
      verifyError,
      currentGradientValues: {
        gradient_start: verifyData?.gradient_start,
        gradient_middle: verifyData?.gradient_middle,
        gradient_end: verifyData?.gradient_end,
        background_type: verifyData?.background_type
      },
      allValues: verifyData
    });

    console.log('[API/update-style] Successfully processed update for business:', businessId);
    return NextResponse.json({
      success: true,
      updated: updateData,
      verified: verifyData
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}