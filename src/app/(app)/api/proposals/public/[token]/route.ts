/**
 * Public Proposal API - Fetch proposal by token (no auth required)
 * Updates status to 'viewed' on first access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    if (!token || token.length !== 64) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !proposal) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if expired
    if (proposal.expiration_date && new Date(proposal.expiration_date) < new Date()) {
      if (proposal.status !== 'expired') {
        await supabase
          .from('proposals')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', proposal.id);
      }
      return NextResponse.json({ error: 'This proposal has expired' }, { status: 410 });
    }

    // Update to viewed on first access (only from sent status)
    if (proposal.status === 'sent') {
      await supabase
        .from('proposals')
        .update({
          status: 'viewed',
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposal.id);
    }

    // Fetch signature if exists
    const { data: signature } = await supabase
      .from('proposal_signatures')
      .select('signer_name, signer_email, signed_at')
      .eq('proposal_id', proposal.id)
      .maybeSingle();

    // Fetch business styling
    const { data: business } = await supabase
      .from('businesses')
      .select('primary_font, secondary_font, primary_color, secondary_color, background_type, gradient_start, gradient_middle, gradient_end, background_color, card_bg, card_text, card_transparency, card_border_width, card_border_color, card_border_transparency, card_inner_shadow, card_shadow_color, card_shadow_intensity, card_glassmorphism, card_backdrop_blur, card_placeholder_color, input_text_color, logo_url, name, text_color')
      .eq('account_id', proposal.account_id)
      .maybeSingle();

    // Return proposal without internal fields
    const { account_id: _a, ...publicProposal } = proposal;

    return NextResponse.json({
      proposal: publicProposal,
      signature: signature || null,
      business: business || null,
    });
  } catch (error) {
    console.error('[PROPOSALS] Public GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
