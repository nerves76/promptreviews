import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrMock, createClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { slugify } from '@/utils/slugify';
import { preparePromptPageData } from '@/utils/promptPageDataMapping';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

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
    } else {
      // If cookie auth fails, try Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const headerResult = await supabaseAdmin.auth.getUser(token);
        if (!headerResult.error && headerResult.data.user) {
          user = headerResult.data.user;
        } else {
          userError = headerResult.error;
        }
      } else {
        userError = cookieResult.error;
      }
    }

    if (!user) {
      console.error('🔒 Bulk API - Authentication failed:', {
        cookieError: cookieResult.error instanceof Error ? cookieResult.error.message : 'No cookie session',
        headerError: userError instanceof Error ? userError.message : 'No valid token',
        hasAuthHeader: !!request.headers.get('authorization')
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { contactIds, promptType, includeReviews, account_id } = await request.json();

    // Get the proper account ID using the header and validate access
    const accountId = await getRequestAccountId(request, user.id);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found or access denied' }, { status: 403 });
    }

    // Validate account_id from request body matches the selected account
    if (account_id && account_id !== accountId) {
      return NextResponse.json({ error: 'Account ID mismatch' }, { status: 403 });
    }
    
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'No contacts selected' }, { status: 400 });
    }

    if (!promptType || !['service', 'product', 'photo', 'event', 'employee'].includes(promptType)) {
      return NextResponse.json({ error: 'Invalid prompt type' }, { status: 400 });
    }

    // Validate business profile
    // IMPORTANT: Don't use .single() as accounts can have multiple businesses
    const { data: businessesData } = await supabaseAdmin
      .from("businesses")
      .select("name")
      .eq("account_id", accountId)
      .order('created_at', { ascending: true }); // Get oldest business first
    
    const businessData = businessesData && businessesData.length > 0 ? businessesData[0] : null;
    
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
    const { data: contacts, error: contactsError } = await supabaseAdmin
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
        const contactName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Contact';
        const slug = slugify(contactName, Date.now().toString(36));
        
        // Prepare form data using the same structure as individual creation
        const formData = {
          account_id: accountId,
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          name: contactName,
          review_type: promptType, // Use review_type instead of category
          campaign_type: 'individual', // Always individual for contacts
          slug: slug,
          title: `${contact.first_name || 'Contact'} ${promptType} review`,
          status: 'draft'
        };

        // Use the same data mapping as individual creation
        const insertData = preparePromptPageData(formData);
        
        const { data: promptPage, error: promptError } = await supabaseAdmin
          .from("prompt_pages")
          .insert(insertData)
          .select()
          .single();

        if (promptError) {
          console.error('❌ Bulk API - Failed to create prompt page:', {
            contactId: contact.id,
            contactName: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
            error: promptError.message,
            details: promptError
          });
          errors.push({
            contactId: contact.id,
            contactName: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
            error: promptError.message
          });
        } else {
          // If includeReviews is true, import existing reviews into the prompt page
          if (includeReviews) {
            try {
              // Fetch reviews for this contact
              const { data: contactReviews, error: reviewsError } = await supabaseAdmin
                .from('review_submissions')
                .select('platform, star_rating, review_content, verified, created_at')
                .eq('contact_id', contact.id)
                .order('created_at', { ascending: false });

              if (reviewsError) {
                console.error('⚠️ Failed to fetch reviews for contact:', contact.id, reviewsError);
              } else if (contactReviews && contactReviews.length > 0) {
                // Import reviews into the prompt page's review platforms
                const reviewPlatforms = contactReviews.map(review => ({
                  platform: review.platform || 'Other',
                  review: review.review_content || '',
                  rating: review.star_rating || 5,
                  verified: review.verified || false,
                  date: review.created_at
                }));

                // Update the prompt page with review platforms
                const { error: updateError } = await supabaseAdmin
                  .from('prompt_pages')
                  .update({
                    review_platforms: reviewPlatforms
                  })
                  .eq('id', promptPage.id);

                if (updateError) {
                  console.error('⚠️ Failed to import reviews for prompt page:', promptPage.id, updateError);
                } else {
                  console.log(`✅ Imported ${contactReviews.length} reviews for prompt page:`, promptPage.id);
                }
              }
            } catch (reviewImportError) {
              console.error('⚠️ Error during review import for contact:', contact.id, reviewImportError);
            }
          }
          results.push({
            contactId: contact.id,
            contactName: contactName,
            promptPageId: promptPage.id,
            slug: promptPage.slug,
            title: promptPage.title
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