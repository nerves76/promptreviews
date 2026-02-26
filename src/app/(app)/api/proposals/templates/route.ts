/**
 * Proposal Templates API - List templates for account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

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

    const { data: templates, error } = await supabase
      .from('proposals')
      .select('id, title, template_name, custom_sections, line_items, show_pricing, show_terms, terms_content, created_at')
      .eq('account_id', accountId)
      .eq('is_template', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[PROPOSALS] Templates list error:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('[PROPOSALS] Templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
