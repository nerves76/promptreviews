import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import slugify from 'slugify';
import { checkAccountLimits } from '@/utils/accountLimits';
import { getUserOrMock, getSessionOrMock } from '@/utils/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log('Starting upload-contacts API route');
    let user;
    let supabase;
    const cookieStore = cookies();
    supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: sessionError } = await getSessionOrMock(supabase);

    if (!session) {
      // Try to get from Authorization header
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });
        const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
        if (tokenError || !tokenUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        user = tokenUser;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      user = session.user;
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
        // Normalize header: lowercase, remove spaces/underscores
        const normalize = (h: string) => h.toLowerCase().replace(/\s|_/g, '');
        const expected = {
          first_name: ['firstname', 'first name', 'first_name'],
          last_name: ['lastname', 'last name', 'last_name'],
          email: ['email', 'emailaddress', 'email_address'],
          phone: ['phone', 'phonenumber', 'phone_number', 'phone#'],
          offer_url: ['offerurl', 'offer url'],
          offer_title: ['offertitle', 'offer title'],
          offer_body: ['offerbody', 'offer body'],
          role: ['role'],
          review_type: ['reviewtype', 'review type'],
          friendly_note: ['friendlynote', 'friendly note'],
          services_offered: ['servicesoffered', 'services offered'],
          outcomes: ['outcomes']
        };
        // Map normalized header to expected field
        return headers.map((header: string) => {
          const norm = normalize(header);
          for (const [key, aliases] of Object.entries(expected)) {
            if (aliases.includes(norm)) return key;
          }
          // Ignore unknown columns by returning null
          return null;
        });
      },
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      quote: '"',
      escape: '"',
      delimiter: ',',
      skip_records_with_empty_values: true
    });

    console.log('Raw parsed records:', records);
    // Filter out any records that are completely empty
    const validRecords = records.filter((record: any, index: number) => {
      // Only keep fields that are in our expected list
      const filtered = Object.fromEntries(Object.entries(record).filter(([k, v]) => k && v !== undefined && v !== null));
      // Remove keys for columns that mapped to null
      for (const key in filtered) {
        if (key === 'null') delete filtered[key];
      }
      // Trim all values
      Object.keys(filtered).forEach(k => {
        if (typeof filtered[k] === 'string') filtered[k] = filtered[k].trim();
      });
      // Check if all values are empty
      const hasData = Object.values(filtered).some(value => value && value.toString().trim().length > 0);
      if (!hasData) return false;
      records[index] = filtered; // update record in place
      return true;
    });

    console.log('Valid records after filtering and trimming:', validRecords);
    console.log('Number of valid records:', validRecords.length);

    // Validate required fields
    const invalidRecords = validRecords.filter((record: any, index: number) => {
      const hasFirstName = record.first_name && record.first_name.trim();
      const hasEmail = record.email && record.email.trim();
      const hasPhone = record.phone && record.phone.trim();
      const isValid = hasFirstName && (hasEmail || hasPhone);
      if (!isValid) {
        console.log(`Record ${index + 1} is invalid:`, record);
      }
      return !isValid;
    });

    console.log('Invalid records:', invalidRecords);

    // Prepare contacts for insertion
    console.log('Preparing contacts for insertion...');
    const contacts = validRecords.map((record: any) => ({
      account_id: user.id,
      first_name: record.first_name?.trim() || null,
      last_name: record.last_name?.trim() || null,
      email: record.email?.trim() || null,
      phone: record.phone?.trim() || null,
      offer_url: record.offer_url?.trim() || null,
      offer_title: record.offer_title?.trim() || null,
      offer_body: record.offer_body?.trim() || null,
      role: record.role?.trim() || null,
      review_type: record.review_type?.trim() || null,
      friendly_note: record.friendly_note?.trim() || null,
      services_offered: record.services_offered?.trim() || null,
      outcomes: record.outcomes?.trim() || null,
      status: 'in_queue'
    }));

    console.log('Contacts to insert:', contacts);
    console.log('User ID:', user.id);
    if (contacts.length === 0) {
      console.log('No contacts to insert. Exiting early.');
    }

    // Insert contacts into the database
    console.log('Inserting contacts into database...');
    if (contacts.length > 0) {
      console.log('First contact data:', contacts[0]); // Log the first contact's data
    }
    console.log('User ID being used:', user.id); // Log the user ID
    console.log('Session:', session); // Log the session

    const { data: insertedContacts, error: insertError } = await supabase
      .from('contacts')
      .insert(contacts)
      .select();

    console.log('Insert result:', insertedContacts);
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
          offer_body: contact.offer_body,
          offer_enabled: true,
          offer_title: contact.offer_title,
          offer_url: contact.offer_url,
          status: 'draft',
          slug: slug,
          services_offered: contact.services_offered,
          outcomes: contact.outcomes,
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