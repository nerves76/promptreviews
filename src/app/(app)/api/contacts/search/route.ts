import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * Search for a contact by name and/or phone
 * Used as a fallback when a prompt page doesn't have a linked contact_id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const phone = searchParams.get('phone');

    if (!firstName && !lastName && !phone) {
      return NextResponse.json({ error: 'At least one search parameter is required' }, { status: 400 });
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

    // Build query to find matching contact
    let query = supabaseAdmin
      .from('contacts')
      .select('id, first_name, last_name, email, phone')
      .eq('account_id', accountId);

    // Add filters - try to match by name first, then phone
    if (firstName && lastName) {
      query = query.ilike('first_name', firstName).ilike('last_name', lastName);
    } else if (firstName) {
      query = query.ilike('first_name', firstName);
    } else if (lastName) {
      query = query.ilike('last_name', lastName);
    }

    // If we have phone, try exact match (after normalizing)
    if (phone) {
      // Normalize phone for comparison - remove non-digits
      const normalizedPhone = phone.replace(/\D/g, '');
      // Use a raw filter to compare normalized phone numbers
      query = query.or(`phone.ilike.%${normalizedPhone.slice(-10)}%`);
    }

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
