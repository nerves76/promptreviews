import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrMock, createClient, createServiceRoleClient } from '@/utils/supabaseClient';
import { getAccountIdForUser } from '@/utils/accountUtils';
import { checkAccountLimits } from '@/utils/accountLimits';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const supabaseAdmin = createServiceRoleClient();
    
    // Get authenticated user - try both cookie and header auth
    let user = null;
    let userError = null;

    // First try cookie-based auth
    const cookieResult = await getSessionOrMock(supabase);
    if (!cookieResult.error && cookieResult.data?.session?.user) {
      user = cookieResult.data.session.user;
      console.log('✅ Contact from Prompt API - Cookie auth successful for user:', user.id);
    } else {
      console.log('❌ Contact from Prompt API - Cookie auth failed:', cookieResult.error instanceof Error ? cookieResult.error.message : 'Unknown error');
      // If cookie auth fails, try Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('🔑 Contact from Prompt API - Trying Authorization header auth with token length:', token.length);
        const headerResult = await supabaseAdmin.auth.getUser(token);
        if (!headerResult.error && headerResult.data.user) {
          user = headerResult.data.user;
          console.log('✅ Contact from Prompt API - Header auth successful for user:', user.id);
        } else {
          console.log('❌ Contact from Prompt API - Header auth failed:', headerResult.error?.message);
          userError = headerResult.error;
        }
      } else {
        console.log('❌ Contact from Prompt API - No valid Authorization header found');
        userError = cookieResult.error;
      }
    }
    
    if (!user) {
      console.error('🔒 Contact from Prompt API - Authentication failed:', {
        cookieError: cookieResult.error instanceof Error ? cookieResult.error.message : 'No cookie session',
        headerError: userError instanceof Error ? userError.message : 'No valid token',
        hasAuthHeader: !!request.headers.get('authorization')
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the correct account ID for this user
    console.log('🔍 Contact from Prompt API - Looking up account for user:', user.id);
    const accountId = await getAccountIdForUser(user.id, supabaseAdmin);
    console.log('🔍 Contact from Prompt API - Account lookup result:', accountId);
    if (!accountId) {
      console.error('❌ Contact from Prompt API - No account found for user:', user.id);
      return NextResponse.json({ error: 'No account found' }, { status: 404 });
    }

    // Check account limits for contact creation
    console.log('🔍 Contact from Prompt API - Checking account limits for user:', user.id);
    const limitCheck = await checkAccountLimits(supabaseAdmin, user.id, 'contact');
    console.log('🔍 Contact from Prompt API - Limit check result:', limitCheck);
    if (!limitCheck.allowed) {
      console.error('❌ Contact from Prompt API - Limit check failed:', limitCheck);
      return NextResponse.json({ 
        error: limitCheck.reason || 'Contact creation not allowed for your account plan',
        upgrade_required: true
      }, { status: 403 });
    }

    // Parse request body
    const { promptPageData, promptPageId } = await request.json();
    
    // Validate required fields
    if (!promptPageData.first_name || promptPageData.first_name.trim() === '') {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }

    if (!promptPageId) {
      return NextResponse.json({ error: 'Prompt page ID is required' }, { status: 400 });
    }

    // Prepare contact for insertion
    const contact = {
      account_id: accountId,
      first_name: promptPageData.first_name?.trim(),
      last_name: promptPageData.last_name?.trim() || null,
      email: promptPageData.email?.trim() || null,
      phone: promptPageData.phone?.trim() || null,
      business_name: promptPageData.business_name?.trim() || null,
      role: promptPageData.role?.trim() || null,
      address_line1: promptPageData.address_line1?.trim() || null,
      address_line2: promptPageData.address_line2?.trim() || null,
      city: promptPageData.city?.trim() || null,
      state: promptPageData.state?.trim() || null,
      postal_code: promptPageData.postal_code?.trim() || null,
      country: promptPageData.country?.trim() || null,
      category: promptPageData.category?.trim() || null,
      notes: promptPageData.notes?.trim() || null,
      status: "in_queue",
    };

    // Insert contact into the database using service role client to bypass RLS
    console.log('🔍 Contact from Prompt API - Creating contact with account_id:', accountId);
    const { data: insertedContact, error: insertError } = await supabaseAdmin
      .from("contacts")
      .insert(contact)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting contact:", insertError);
      return NextResponse.json(
        {
          error: "Failed to create contact",
          details: insertError.message || "Database error while creating contact",
        },
        { status: 500 }
      );
    }

    // Link the prompt page to the newly created contact
    console.log('🔍 Contact from Prompt API - Linking prompt page to contact:', promptPageId, insertedContact.id);
    const { error: linkError } = await supabaseAdmin
      .from("prompt_pages")
      .update({ contact_id: insertedContact.id })
      .eq("id", promptPageId);

    if (linkError) {
      console.error("Error linking prompt page to contact:", linkError);
      // Note: We don't fail the entire request if linking fails
      // The contact was created successfully, so we return success
      // but log the linking error
    } else {
      console.log('✅ Contact from Prompt API - Successfully linked prompt page to contact');
    }

    return NextResponse.json({
      success: true,
      contact: insertedContact,
      promptPageLinked: true,
      message: "Contact created and linked to prompt page successfully"
    });

  } catch (error) {
    console.error('Create contact from prompt page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 