import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * Search contacts.
 *
 * Modes:
 * - ?q=<text>          — name-based autocomplete (returns { contacts: [...] })
 * - ?phone=&email=     — unique-identifier lookup (returns { contact: ... | null })
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createServiceRoleClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // ── Name-based autocomplete (?q=) ──────────────────────────────────
    if (q && q.length >= 2) {
      const parts = q.split(/\s+/);
      const conditions: string[] = [];

      if (parts.length === 1) {
        // Single word — match against first OR last name
        conditions.push(`first_name.ilike.%${parts[0]}%`);
        conditions.push(`last_name.ilike.%${parts[0]}%`);
        conditions.push(`email.ilike.%${parts[0]}%`);
      } else {
        // Multiple words — first token matches first_name, last token matches last_name
        conditions.push(`first_name.ilike.%${parts[0]}%`);
        conditions.push(`last_name.ilike.%${parts[parts.length - 1]}%`);
      }

      const { data: contacts, error: searchError } = await supabaseAdmin
        .from('contacts')
        .select('id, first_name, last_name, email, company, address_line1, address_line2, city, state, postal_code')
        .eq('account_id', accountId)
        .or(conditions.join(','))
        .order('first_name', { ascending: true })
        .limit(10);

      if (searchError) {
        console.error('Error searching contacts by name:', searchError);
        return NextResponse.json({ error: 'Failed to search contacts' }, { status: 500 });
      }

      // Map to the shape the frontend expects
      const mapped = (contacts || []).map((c) => {
        const addressParts = [c.address_line1, c.address_line2, c.city, c.state, c.postal_code].filter(Boolean);
        return {
          id: c.id,
          name: [c.first_name, c.last_name].filter(Boolean).join(' '),
          email: c.email || '',
          company: c.company || null,
          address: addressParts.length > 0 ? addressParts.join(', ') : null,
        };
      });

      return NextResponse.json({ contacts: mapped });
    }

    // ── Unique-identifier lookup (?phone= / ?email=) ───────────────────
    if (!phone && !email) {
      return NextResponse.json({ error: 'Phone, email, or q parameter is required' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('contacts')
      .select('id, first_name, last_name, email, phone')
      .eq('account_id', accountId);

    const conditions: string[] = [];

    if (phone) {
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

    query = query.or(conditions.join(','));

    const { data: contacts, error: fetchError } = await query.limit(1);

    if (fetchError) {
      console.error('Error searching contacts:', fetchError);
      return NextResponse.json({ error: 'Failed to search contacts' }, { status: 500 });
    }

    return NextResponse.json({ contact: contacts?.[0] || null });

  } catch (error) {
    console.error('Contact search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
