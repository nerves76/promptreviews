/**
 * Proposal Section Templates API - List and Create
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { validateRequiredString, validateStringLength, STRING_LIMITS } from '@/app/(app)/api/utils/validation';

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
      .from('proposal_section_templates')
      .select('*')
      .eq('account_id', accountId)
      .order('name', { ascending: true })
      .limit(200);

    if (error) {
      console.error('[SECTION_TEMPLATES] List error:', error);
      return NextResponse.json({ error: 'Failed to fetch section templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('[SECTION_TEMPLATES] Unexpected error:', error);
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

    // Validate name
    const nameError = validateRequiredString(body.name, 'Name', STRING_LIMITS.name);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    // Validate title
    const titleError = validateRequiredString(body.title, 'Title', STRING_LIMITS.shortText);
    if (titleError) {
      return NextResponse.json({ error: titleError }, { status: 400 });
    }

    // Validate body
    const bodyError = validateStringLength(body.body, 'Body', STRING_LIMITS.longText);
    if (bodyError) {
      return NextResponse.json({ error: bodyError }, { status: 400 });
    }

    const { data: template, error: createError } = await supabase
      .from('proposal_section_templates')
      .insert({
        account_id: accountId,
        name: body.name.trim(),
        title: body.title.trim(),
        body: body.body || '',
      })
      .select()
      .single();

    if (createError) {
      // Unique constraint violation
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'A section template with this name already exists' }, { status: 409 });
      }
      console.error('[SECTION_TEMPLATES] Create error:', createError);
      return NextResponse.json({ error: 'Failed to create section template' }, { status: 500 });
    }

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('[SECTION_TEMPLATES] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
