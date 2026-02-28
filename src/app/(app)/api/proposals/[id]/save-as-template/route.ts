/**
 * Proposal Save as Template API
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { isValidUuid } from '@/app/(app)/api/utils/validation';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

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
    const templateName = body.template_name?.trim() || null;

    // Fetch original
    const { data: original, error: fetchError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const { data: template, error: createError } = await supabase
      .from('proposals')
      .insert({
        account_id: accountId,
        token,
        title: original.title,
        proposal_date: new Date().toISOString().split('T')[0],
        expiration_date: null,
        client_first_name: null,
        client_last_name: null,
        client_email: null,
        client_company: null,
        contact_id: null,
        business_name: original.business_name,
        business_email: original.business_email,
        business_phone: original.business_phone,
        business_address: original.business_address,
        business_logo_url: original.business_logo_url,
        business_website: original.business_website,
        show_pricing: original.show_pricing,
        pricing_type: original.pricing_type || 'fixed',
        show_terms: original.show_terms,
        terms_content: original.terms_content,
        custom_sections: original.custom_sections,
        line_items: original.line_items,
        status: 'draft',
        is_template: true,
        template_name: templateName || original.title,
        sow_number: null,
      })
      .select()
      .single();

    if (createError || !template) {
      console.error('[PROPOSALS] Save as template error:', createError);
      return NextResponse.json({ error: 'Failed to save as template' }, { status: 500 });
    }

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('[PROPOSALS] Save as template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
