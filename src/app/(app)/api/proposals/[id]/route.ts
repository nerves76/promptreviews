/**
 * Proposal API - Get, Update, Delete single proposal
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { isValidUuid } from '@/app/(app)/api/utils/validation';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
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

    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (error || !proposal) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Fetch signature if exists
    const { data: signature } = await supabase
      .from('proposal_signatures')
      .select('*')
      .eq('proposal_id', id)
      .maybeSingle();

    return NextResponse.json({ ...proposal, signature: signature || null });
  } catch (error) {
    console.error('[PROPOSALS] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
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

    // Verify ownership and check status
    const { data: existing } = await supabase
      .from('proposals')
      .select('id, status')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Only allow updates when draft or sent
    if (!['draft', 'sent'].includes(existing.status)) {
      return NextResponse.json({ error: 'Cannot edit a contract that has been accepted or declined' }, { status: 400 });
    }

    const body = await request.json();
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    const allowedFields = [
      'title', 'proposal_date', 'expiration_date',
      'client_first_name', 'client_last_name', 'client_email', 'client_company', 'contact_id',
      'show_pricing', 'show_terms', 'terms_content',
      'custom_sections', 'line_items',
      'is_template', 'template_name', 'status',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { error: updateError } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', id)
      .eq('account_id', accountId);

    if (updateError) {
      console.error('[PROPOSALS] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
    }

    // Return updated proposal
    const { data: updated } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PROPOSALS] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId);

    if (error) {
      console.error('[PROPOSALS] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PROPOSALS] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
