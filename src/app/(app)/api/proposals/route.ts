/**
 * Proposals API - List and Create
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { validateRequiredString, validateStringLength, STRING_LIMITS } from '@/app/(app)/api/utils/validation';
import { getNextSowNumber } from '@/features/proposals/sowHelpers';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const isTemplate = searchParams.get('is_template') === 'true';

    let query = supabase
      .from('proposals')
      .select('*', { count: 'exact' })
      .eq('account_id', accountId)
      .eq('is_template', isTemplate)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: proposals, error, count } = await query;

    if (error) {
      console.error('[PROPOSALS] List error:', error);
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }

    return NextResponse.json({ proposals: proposals || [], total: count ?? 0 });
  } catch (error) {
    console.error('[PROPOSALS] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Validate title
    const titleError = validateRequiredString(body.title, 'Title', STRING_LIMITS.name);
    if (titleError) {
      return NextResponse.json({ error: titleError }, { status: 400 });
    }

    // Validate optional string fields
    const firstNameError = validateStringLength(body.client_first_name, 'Client first name', STRING_LIMITS.name);
    if (firstNameError) return NextResponse.json({ error: firstNameError }, { status: 400 });

    const lastNameError = validateStringLength(body.client_last_name, 'Client last name', STRING_LIMITS.name);
    if (lastNameError) return NextResponse.json({ error: lastNameError }, { status: 400 });

    const clientEmailError = validateStringLength(body.client_email, 'Client email', STRING_LIMITS.email);
    if (clientEmailError) return NextResponse.json({ error: clientEmailError }, { status: 400 });

    const clientCompanyError = validateStringLength(body.client_company, 'Client company', STRING_LIMITS.name);
    if (clientCompanyError) return NextResponse.json({ error: clientCompanyError }, { status: 400 });

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const isTemplate = body.is_template ?? false;

    // For non-template proposals, generate SOW number if account has a prefix
    let sowNumber: number | null = null;
    if (!isTemplate) {
      const { data: account } = await supabase
        .from('accounts')
        .select('sow_prefix')
        .eq('id', accountId)
        .single();

      if (account?.sow_prefix) {
        sowNumber = await getNextSowNumber(supabase, accountId);
      }
    }

    // Snapshot business info
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
        title: body.title.trim(),
        proposal_date: body.proposal_date || new Date().toISOString().split('T')[0],
        expiration_date: body.expiration_date || null,
        client_first_name: body.client_first_name?.trim() || null,
        client_last_name: body.client_last_name?.trim() || null,
        client_email: body.client_email?.trim() || null,
        client_company: body.client_company?.trim() || null,
        contact_id: body.contact_id || null,
        business_name: business?.name || null,
        business_email: business?.email || null,
        business_phone: business?.phone || null,
        business_address: body.business_address?.trim() || business?.address || null,
        business_logo_url: business?.logo_url || null,
        business_website: business?.website || null,
        show_pricing: body.show_pricing ?? true,
        pricing_type: body.pricing_type || 'fixed',
        show_terms: body.show_terms ?? false,
        show_sow_number: body.show_sow_number ?? true,
        terms_content: body.terms_content || null,
        custom_sections: body.custom_sections || [],
        line_items: body.line_items || [],
        is_template: isTemplate,
        template_name: body.template_name?.trim() || null,
        sow_number: sowNumber,
      })
      .select()
      .single();

    if (createError) {
      console.error('[PROPOSALS] Create error:', createError);
      return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
    }

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error('[PROPOSALS] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
