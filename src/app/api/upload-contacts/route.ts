import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import slugify from 'slugify';
import { checkAccountLimits } from '@/utils/accountLimits';
import { getUserOrMock, getSessionOrMock } from '@/utils/supabase';

export async function POST(request: Request) {
  try {
    console.log('Starting upload-contacts API route');
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    console.log('Checking authentication...');
    const { data: { session }, error: sessionError } = await getSessionOrMock(supabase);
    let user;
    
    // If no session in cookies, try to get from Authorization header
    if (!session) {
      console.log('No session found in cookies, checking Authorization header...');
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { data: { user: tokenUser }, error: tokenError } = await getUserOrMock(supabase);
        if (tokenError || !tokenUser) {
          console.error('Token auth error:', tokenError);
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        user = tokenUser;
        console.log('User authenticated via token');
      } else {
        console.error('No valid auth found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      user = session.user;
      console.log('User authenticated via session');
    }

    if (!user) {
      console.error('No user found after authentication');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ENFORCE ACCOUNT LIMITS
    const limitCheck = await checkAccountLimits(supabase, user.id, 'contact');
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason || 'Upgrade required to add contacts.' }, { status: 403 });
    }

    // Get the form data
    console.log('Getting form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read and parse the CSV file
    console.log('Starting CSV processing...');
    const text = await file.text();
    console.log('Raw CSV content:', text);
    
    // First, split the text into lines and clean them
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.split(',').some(cell => cell.trim().length > 0));
    
    console.log('Cleaned lines:', lines);
    console.log('Number of lines:', lines.length);
    
    // Parse the CSV with more lenient settings
    const records = parse(lines.join('\n'), {
      columns: (headers) => {
        console.log('Raw headers before mapping:', headers);
        const mappedHeaders = headers.map(header => {
          const cleanHeader = header.trim().toLowerCase();
          console.log(`Processing header: "${header}" -> "${cleanHeader}"`);
          // Map any variations of column names to our expected format
          const headerMap: { [key: string]: string } = {
            'first name': 'first_name',
            'firstname': 'first_name',
            'last name': 'last_name',
            'lastname': 'last_name',
            'email address': 'email',
            'phone number': 'phone',
            'phone #': 'phone',
            'review rewards': 'review_rewards',
            'google url': 'google_url',
            'yelp url': 'yelp_url',
            'facebook url': 'facebook_url',
            'google review': 'google_review',
            'yelp review': 'yelp_review',
            'facebook review': 'facebook_review',
            'google instructions': 'google_instructions',
            'yelp instructions': 'yelp_instructions',
            'facebook instructions': 'facebook_instructions',
            'offer url': 'offer_url'
          };
          const mappedHeader = headerMap[cleanHeader] || cleanHeader;
          console.log(`Mapped header: "${cleanHeader}" -> "${mappedHeader}"`);
          return mappedHeader;
        });
        console.log('Final mapped headers:', mappedHeaders);
        return mappedHeaders;
      },
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      quote: '"',
      escape: '"',
      delimiter: ',',
      skip_records_with_empty_values: true,
      from_line: 2 // Skip the header row
    });

    console.log('Parsed records:', records);
    console.log('Number of parsed records:', records.length);

    // Filter out any records that are completely empty
    const validRecords = records.filter((record: any, index: number) => {
      const values = Object.values(record);
      const hasData = values.some(value => value && value.toString().trim().length > 0);
      console.log(`Record ${index + 1} validation:`, {
        record,
        hasData,
        values
      });
      return hasData;
    });

    console.log('Valid records after filtering:', validRecords);
    console.log('Number of valid records:', validRecords.length);

    // Validate required fields
    const invalidRecords = validRecords.filter((record: any, index: number) => {
      // Log the raw record data
      console.log(`Validating record ${index + 1}:`, {
        rawRecord: record,
        keys: Object.keys(record),
        values: Object.values(record),
        first_name: record.first_name,
        email: record.email,
        phone: record.phone
      });

      // Check each required field individually
      const hasFirstName = record.first_name && record.first_name.trim();
      const hasEmail = record.email && record.email.trim();
      const hasPhone = record.phone && record.phone.trim();

      // Log the validation results
      console.log(`Record ${index + 1} validation:`, {
        hasFirstName,
        hasEmail,
        hasPhone,
        firstNameValue: record.first_name,
        emailValue: record.email,
        phoneValue: record.phone
      });

      const isValid = hasFirstName && (hasEmail || hasPhone);
      
      if (!isValid) {
        console.log(`Record ${index + 1} is invalid:`, {
          hasFirstName,
          hasEmail,
          hasPhone,
          record
        });
      }
      
      return !isValid;
    });

    if (invalidRecords.length > 0) {
      console.error('Invalid records found:', invalidRecords);
      const detailedErrors = invalidRecords.map((record: any, index: number) => {
        const rowNum = index + 2; // +2 because of 0-based index and header row
        const missingFields = [];
        if (!record.first_name?.trim()) missingFields.push('first_name');
        if (!record.email?.trim() && !record.phone?.trim()) missingFields.push('email or phone');
        
        return {
          row: rowNum,
          record,
          missingFields: missingFields.join(', '),
          rawValues: {
            first_name: record.first_name,
            email: record.email,
            phone: record.phone
          }
        };
      });

      return NextResponse.json({ 
        error: 'Some records are missing required fields. First name is required, and either email or phone must be provided.',
        invalidRecords: detailedErrors
      }, { status: 400 });
    }

    // Prepare contacts for insertion
    console.log('Preparing contacts for insertion...');
    const contacts = validRecords.map((record: any) => ({
      account_id: user.id,
      first_name: record.first_name.trim(),
      last_name: record.last_name?.trim() || null,
      email: record.email?.trim() || null,
      phone: record.phone?.trim() || null,
      category: record.category?.trim() || null,
      notes: record.notes?.trim() || null,
      google_url: record.google_url?.trim() || null,
      yelp_url: record.yelp_url?.trim() || null,
      facebook_url: record.facebook_url?.trim() || null,
      google_review: record.google_review?.trim() || null,
      yelp_review: record.yelp_review?.trim() || null,
      facebook_review: record.facebook_review?.trim() || null,
      google_instructions: record.google_instructions?.trim() || null,
      yelp_instructions: record.yelp_instructions?.trim() || null,
      facebook_instructions: record.facebook_instructions?.trim() || null,
      review_rewards: record.review_rewards?.trim() || null,
      status: 'in_queue'
    }));

    console.log('Prepared contacts:', contacts);
    console.log('User ID:', user.id);

    // Insert contacts into the database
    console.log('Inserting contacts into database...');
    console.log('First contact data:', contacts[0]); // Log the first contact's data
    console.log('User ID being used:', user.id); // Log the user ID
    console.log('Session:', session); // Log the session

    const { data: insertedContacts, error: insertError } = await supabase
      .from('contacts')
      .insert(contacts)
      .select();

    if (insertError) {
      console.error('Error inserting contacts:', insertError);
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return NextResponse.json({ 
        error: 'Failed to save contacts', 
        details: insertError.message || 'Database error while inserting contacts'
      }, { status: 500 });
    }

    console.log(`Successfully inserted ${insertedContacts?.length || 0} contacts:`, insertedContacts);

    // Create prompt pages for each contact
    console.log('Creating prompt pages...');
    let createdPages = 0;
    let errors = [];

    for (const contact of insertedContacts || []) {
      try {
        console.log(`Processing contact for prompt page:`, contact);
        
        // Check if a prompt page already exists for this contact
        const { data: existingPages, error: existingPagesError } = await supabase
          .from('prompt_pages')
          .select('id')
          .eq('account_id', user.id)
          .or([
            contact.email ? `email.eq.${contact.email}` : '',
            contact.phone ? `phone.eq.${contact.phone}` : ''
          ].filter(Boolean).join(','));
        
        if (existingPagesError) {
          console.error(`Error checking existing pages for contact ${contact.id}:`, existingPagesError);
          continue;
        }
        
        if (existingPages && existingPages.length > 0) {
          console.log(`Skipping prompt page creation for contact ${contact.id} - already exists`);
          continue;
        }

        // Create prompt page for this contact
        console.log(`Creating prompt page for contact ${contact.id}...`);
        
        // Generate a unique slug from the contact's name
        const slugBase = `${contact.first_name} ${contact.last_name || ''}`.trim();
        const slug = slugify(slugBase, { lower: true, strict: true }) + '-' + Date.now().toString(36);
        
        const pageData = {
          account_id: user.id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          client_name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
          review_platforms: [
            contact.google_url ? { 
              platform: 'Google', 
              url: contact.google_url, 
              name: contact.first_name,
              wordCount: contact.google_review ? contact.google_review.split(/\s+/).length : 0,
              reviewText: contact.google_review || '',
              customInstructions: contact.google_instructions || '' 
            } : null,
            contact.yelp_url ? { 
              platform: 'Yelp', 
              url: contact.yelp_url, 
              name: contact.first_name,
              wordCount: contact.yelp_review ? contact.yelp_review.split(/\s+/).length : 0,
              reviewText: contact.yelp_review || '',
              customInstructions: contact.yelp_instructions || '' 
            } : null,
            contact.facebook_url ? { 
              platform: 'Facebook', 
              url: contact.facebook_url, 
              name: contact.first_name,
              wordCount: contact.facebook_review ? contact.facebook_review.split(/\s+/).length : 0,
              reviewText: contact.facebook_review || '',
              customInstructions: contact.facebook_instructions || '' 
            } : null,
          ].filter(Boolean),
          offer_body: contact.review_rewards,
          offer_enabled: true,
          offer_title: 'Review Reward',
          offer_url: contact.offer_url?.trim() || null,
          status: 'draft',
          slug: slug,
          services_offered: null,
          outcomes: null,
          project_type: null,
          is_universal: false,
          team_member: null,
          location: null,
          tone_of_voice: null,
          date_completed: null,
          assigned_team_members: null,
          qr_code_url: null
        };

        console.log('Inserting prompt page with data:', JSON.stringify(pageData, null, 2));
        console.log('Review platforms:', JSON.stringify(pageData.review_platforms, null, 2));

        const { data: insertedPage, error: insertPageError } = await supabase
          .from('prompt_pages')
          .insert(pageData)
          .select()
          .single();

        if (insertPageError) {
          console.error(`Error creating prompt page for contact ${contact.id}:`, insertPageError);
          console.error('Error details:', {
            code: insertPageError.code,
            message: insertPageError.message,
            details: insertPageError.details,
            hint: insertPageError.hint,
            pageData: JSON.stringify(pageData, null, 2)
          });
          errors.push({ 
            name: `${contact.first_name} ${contact.last_name || ''}`, 
            error: insertPageError.message,
            details: insertPageError.details,
            hint: insertPageError.hint,
            code: insertPageError.code
          });
        } else {
          createdPages++;
          console.log(`Successfully created prompt page for contact ${contact.id}:`, insertedPage);
        }
      } catch (error) {
        console.error(`Unexpected error processing contact ${contact.id}:`, error);
        errors.push({ 
          name: `${contact.first_name} ${contact.last_name || ''}`, 
          error: 'Unexpected error processing contact',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (errors.length > 0) {
      console.log('Completed with errors:', errors);
      return NextResponse.json({ 
        message: `Created ${createdPages} prompt pages with ${errors.length} errors`,
        errors,
        contactsCreated: insertedContacts?.length || 0,
        promptPagesCreated: createdPages
      }, { status: 207 });
    }

    console.log('Successfully completed all operations');
    return NextResponse.json({ 
      message: 'Successfully uploaded contacts and created prompt pages',
      contactsCreated: insertedContacts?.length || 0,
      promptPagesCreated: createdPages
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 