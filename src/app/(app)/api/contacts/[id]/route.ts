import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactId } = await params;

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createServiceRoleClient();

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the proper account ID using the header and validate access
    const accountId = await getRequestAccountId(request, user.id);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found or access denied' }, { status: 403 });
    }

    // Fetch the contact, ensuring it belongs to the user's account
    const { data: contact, error: fetchError } = await supabaseAdmin
      .from('contacts')
      .select('id, first_name, last_name, email, phone, business_name, role, category, notes, status, account_id, created_at')
      .eq('id', contactId)
      .eq('account_id', accountId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
      }
      console.error('Error fetching contact:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 });
    }

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ contact });

  } catch (error) {
    console.error('Get contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
