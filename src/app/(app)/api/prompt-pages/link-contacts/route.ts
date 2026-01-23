import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * Link unlinked prompt pages to matching contacts
 * Matches by first_name + last_name or phone
 */
export async function POST(request: NextRequest) {
  try {
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

    // Get all unlinked prompt pages for this account
    const { data: unlinkedPages, error: pagesError } = await supabaseAdmin
      .from('prompt_pages')
      .select('id, first_name, last_name, phone, email')
      .eq('account_id', accountId)
      .is('contact_id', null)
      .eq('campaign_type', 'individual');

    if (pagesError) {
      console.error('Error fetching unlinked pages:', pagesError);
      return NextResponse.json({ error: 'Failed to fetch prompt pages' }, { status: 500 });
    }

    if (!unlinkedPages || unlinkedPages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unlinked prompt pages found',
        linked: 0
      });
    }

    // Get all contacts for this account
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('contacts')
      .select('id, first_name, last_name, phone, email')
      .eq('account_id', accountId);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No contacts found to match',
        linked: 0
      });
    }

    // Try to link each unlinked page to a matching contact
    let linkedCount = 0;
    const linkedPages: { pageId: string; contactId: string; matchedBy: string }[] = [];

    for (const page of unlinkedPages) {
      // Try to find a matching contact
      let matchedContact = null;
      let matchedBy = '';

      // First try exact name match (case insensitive)
      if (page.first_name && page.last_name) {
        matchedContact = contacts.find(c =>
          c.first_name?.toLowerCase() === page.first_name?.toLowerCase() &&
          c.last_name?.toLowerCase() === page.last_name?.toLowerCase()
        );
        if (matchedContact) matchedBy = 'name';
      }

      // If no name match, try phone match
      if (!matchedContact && page.phone) {
        const normalizedPagePhone = page.phone.replace(/\D/g, '').slice(-10);
        matchedContact = contacts.find(c => {
          if (!c.phone) return false;
          const normalizedContactPhone = c.phone.replace(/\D/g, '').slice(-10);
          return normalizedContactPhone === normalizedPagePhone;
        });
        if (matchedContact) matchedBy = 'phone';
      }

      // If no phone match, try email match
      if (!matchedContact && page.email) {
        matchedContact = contacts.find(c =>
          c.email?.toLowerCase() === page.email?.toLowerCase()
        );
        if (matchedContact) matchedBy = 'email';
      }

      // Link the page to the contact
      if (matchedContact) {
        const { error: updateError } = await supabaseAdmin
          .from('prompt_pages')
          .update({ contact_id: matchedContact.id })
          .eq('id', page.id);

        if (!updateError) {
          linkedCount++;
          linkedPages.push({
            pageId: page.id,
            contactId: matchedContact.id,
            matchedBy
          });
        } else {
          console.error('Failed to link page:', page.id, updateError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Linked ${linkedCount} of ${unlinkedPages.length} unlinked prompt pages`,
      linked: linkedCount,
      total: unlinkedPages.length,
      details: linkedPages
    });

  } catch (error) {
    console.error('Link contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
