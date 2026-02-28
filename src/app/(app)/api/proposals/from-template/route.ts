/**
 * Proposal From Template API - Create a new proposal from an existing template
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { isValidUuid } from '@/app/(app)/api/utils/validation';
import { getNextSowNumber } from '@/features/proposals/sowHelpers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const body = await request.json();
    const { template_id } = body;

    if (!isValidUuid(template_id)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    // Fetch template
    const { data: template, error: fetchError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', template_id)
      .eq('account_id', accountId)
      .eq('is_template', true)
      .single();

    if (fetchError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const token = crypto.randomBytes(32).toString('hex');

    // Generate SOW number if account has a prefix
    let sowNumber: number | null = null;
    const { data: account } = await supabase
      .from('accounts')
      .select('sow_prefix')
      .eq('id', accountId)
      .single();

    if (account?.sow_prefix) {
      sowNumber = await getNextSowNumber(supabase, accountId);
    }

    // Snapshot fresh business info
    const { data: business } = await supabase
      .from('businesses')
      .select('name, email, phone, address, logo_url, website')
      .eq('account_id', accountId)
      .maybeSingle();

    const { data: proposal, error: createError } = await supabase
      .from('proposals')
      .insert({
        account_id: accountId,
        token,
        title: template.title,
        proposal_date: new Date().toISOString().split('T')[0],
        expiration_date: null,
        client_first_name: null,
        client_last_name: null,
        client_email: null,
        client_company: null,
        contact_id: null,
        business_name: business?.name || template.business_name,
        business_email: business?.email || template.business_email,
        business_phone: business?.phone || template.business_phone,
        business_address: business?.address || template.business_address,
        business_logo_url: business?.logo_url || template.business_logo_url,
        business_website: business?.website || template.business_website,
        show_pricing: template.show_pricing,
        pricing_type: template.pricing_type || 'fixed',
        show_terms: template.show_terms,
        terms_content: template.terms_content,
        custom_sections: template.custom_sections,
        line_items: template.line_items,
        status: 'draft',
        is_template: false,
        sow_number: sowNumber,
      })
      .select()
      .single();

    if (createError || !proposal) {
      console.error('[PROPOSALS] Create from template error:', createError);
      return NextResponse.json({ error: 'Failed to create from template' }, { status: 500 });
    }

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error('[PROPOSALS] From template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
