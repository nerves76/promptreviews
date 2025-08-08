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

    // Debug: Log all headers
    console.log('🔍 Contacts API - Request headers:', {
      authorization: request.headers.get('authorization'),
      'content-type': request.headers.get('content-type'),
      hasAuthHeader: !!request.headers.get('authorization'),
      allHeaders: Array.from(request.headers.entries())
    });

    // First try cookie-based auth
    const cookieResult = await getSessionOrMock(supabase);
    if (!cookieResult.error && cookieResult.data?.session?.user) {
      user = cookieResult.data.session.user;
      console.log('✅ Contacts API - Cookie auth successful for user:', user.id);
    } else {
      console.log('❌ Contacts API - Cookie auth failed:', cookieResult.error instanceof Error ? cookieResult.error.message : 'Unknown error');
      // If cookie auth fails, try Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('🔑 Contacts API - Trying Authorization header auth with token length:', token.length);
        const headerResult = await supabaseAdmin.auth.getUser(token);
        if (!headerResult.error && headerResult.data.user) {
          user = headerResult.data.user;
          console.log('✅ Contacts API - Header auth successful for user:', user.id);
        } else {
          console.log('❌ Contacts API - Header auth failed:', headerResult.error?.message);
          userError = headerResult.error;
        }
      } else {
        console.log('❌ Contacts API - No valid Authorization header found');
        userError = cookieResult.error;
      }
    }
    
    if (!user) {
      console.error('🔒 Contacts API - Authentication failed:', {
        cookieError: cookieResult.error instanceof Error ? cookieResult.error.message : 'No cookie session',
        headerError: userError instanceof Error ? userError.message : 'No valid token',
        hasAuthHeader: !!request.headers.get('authorization')
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the correct account ID for this user
    console.log('🔍 Contacts API - Looking up account for user:', user.id);
    const accountId = await getAccountIdForUser(user.id, supabaseAdmin);
    console.log('🔍 Contacts API - Account lookup result:', accountId);
    if (!accountId) {
      console.error('❌ Contacts API - No account found for user:', user.id);
      return NextResponse.json({ error: 'No account found' }, { status: 404 });
    }

    // Check account limits for contact creation
    console.log('🔍 Contacts API - Checking account limits for user:', user.id);
    const limitCheck = await checkAccountLimits(supabaseAdmin, user.id, 'contact');
    console.log('🔍 Contacts API - Limit check result:', limitCheck);
    if (!limitCheck.allowed) {
      console.error('❌ Contacts API - Limit check failed:', limitCheck);
      return NextResponse.json({ 
        error: limitCheck.reason || 'Contact creation not allowed for your account plan',
        upgrade_required: true
      }, { status: 403 });
    }

    // Parse request body
    const contactData = await request.json();
    
    // Validate required fields
    if (!contactData.first_name || contactData.first_name.trim() === '') {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }

    // Prepare contact for insertion
    const contact = {
      account_id: accountId,
      first_name: contactData.first_name?.trim(),
      last_name: contactData.last_name?.trim() || null,
      email: contactData.email?.trim() || null,
      phone: contactData.phone?.trim() || null,
      business_name: contactData.business_name?.trim() || null,
      role: contactData.role?.trim() || null,
      address_line1: contactData.address_line1?.trim() || null,
      address_line2: contactData.address_line2?.trim() || null,
      city: contactData.city?.trim() || null,
      state: contactData.state?.trim() || null,
      postal_code: contactData.postal_code?.trim() || null,
      country: contactData.country?.trim() || null,
      category: contactData.category?.trim() || null,
      notes: contactData.notes?.trim() || null,
      status: "in_queue",
    };

    // Insert contact into the database using service role client to bypass RLS
    console.log('🔍 Contacts API - Creating contact with account_id:', accountId);
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

    return NextResponse.json({
      success: true,
      contact: insertedContact,
      message: "Contact created successfully"
    });

  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 