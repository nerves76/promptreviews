import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrMock, createClient } from '@/utils/supabaseClient';
import { getAccountIdForUser } from '@/utils/accountUtils';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { session }, error: sessionError } = await getSessionOrMock(supabase);
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the correct account ID for this user
    const accountId = await getAccountIdForUser(session.user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 });
    }

    // Parse request body
    const { contactIds, promptType } = await request.json();
    
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'No contacts selected' }, { status: 400 });
    }

    if (!promptType || !['service', 'product', 'photo', 'event'].includes(promptType)) {
      return NextResponse.json({ error: 'Invalid prompt type' }, { status: 400 });
    }

    // Validate business profile
    const { data: businessData } = await supabase
      .from("businesses")
      .select("name")
      .eq("account_id", accountId)
      .single();
    
    if (!businessData) {
      return NextResponse.json({ 
        error: 'Please create a business profile first before creating prompt pages. You can do this from the "Your Business" section in the dashboard.' 
      }, { status: 400 });
    }
    
    if (!businessData.name || businessData.name.trim() === '') {
      return NextResponse.json({ 
        error: 'Please complete your business profile by adding your business name. This is required for creating prompt pages.' 
      }, { status: 400 });
    }

    // Fetch selected contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .in("id", contactIds)
      .eq("account_id", accountId);

    if (contactsError) {
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: 'No valid contacts found' }, { status: 404 });
    }

    // Create prompt pages for each contact
    const results = [];
    const errors = [];

    for (const contact of contacts) {
      try {
        // Generate unique slug
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const slug = `${contact.first_name?.toLowerCase() || 'contact'}-${contact.last_name?.toLowerCase() || 'prompt'}-${timestamp}-${randomId}`;

        // Create prompt page
        const { data: promptPage, error: promptError } = await supabase
          .from("prompt_pages")
          .insert({
            account_id: accountId,
            contact_id: contact.id,
            type: promptType,
            campaign_type: 'individual', // Always individual for contacts
            slug: slug,
            title: `${contact.first_name || 'Contact'} ${promptType} review`,
            description: `Share your experience with ${contact.first_name || 'our'} ${promptType}. Your review helps others make informed decisions.`,
            status: 'draft',
            created_by: session.user.id
          })
          .select()
          .single();

        if (promptError) {
          errors.push({
            contactId: contact.id,
            contactName: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
            error: promptError.message
          });
        } else {
          results.push({
            contactId: contact.id,
            contactName: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
            promptPageId: promptPage.id,
            slug: promptPage.slug
          });
        }
      } catch (error) {
        errors.push({
          contactId: contact.id,
          contactName: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
          error: 'Failed to create prompt page'
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Bulk create prompt pages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 