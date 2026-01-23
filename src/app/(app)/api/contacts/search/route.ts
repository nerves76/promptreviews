import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * Search for a contact by phone or email (unique identifiers only)
 * Used as a fallback when a prompt page doesn't have a linked contact_id
 *
 * NOTE: We intentionally don't match by name alone to avoid matching
 * the wrong contact when multiple people have the same name.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    // Require at least phone or email - don't match by name alone
    if (!phone && !email) {
      return NextResponse.json({ error: 'Phone or email is required for contact search' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createServiceRoleClient();

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the proper account ID
    const accountId = await getRequestAccountId(request, user.id);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Build query to find matching contact by unique identifiers
    let query = supabaseAdmin
      .from('contacts')
      .select('id, first_name, last_name, email, phone')
      .eq('account_id', accountId);

    // Build OR conditions for phone and email
    const conditions: string[] = [];

    if (phone) {
      // Normalize phone for comparison - remove non-digits, use last 10 digits
      const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
      if (normalizedPhone.length >= 7) {
        conditions.push(`phone.ilike.%${normalizedPhone}%`);
      }
    }

    if (email) {
      conditions.push(`email.ilike.${email}`);
    }

    if (conditions.length === 0) {
      return NextResponse.json({ contact: null });
    }

    // Use OR to match either phone or email
    query = query.or(conditions.join(','));

    const { data: contacts, error: fetchError } = await query.limit(1);

    if (fetchError) {
      console.error('Error searching contacts:', fetchError);
      return NextResponse.json({ error: 'Failed to search contacts' }, { status: 500 });
    }

    // Return the first match, or null if no match
    return NextResponse.json({ contact: contacts?.[0] || null });

  } catch (error) {
    console.error('Contact search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
