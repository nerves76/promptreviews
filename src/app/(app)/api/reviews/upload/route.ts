import { NextResponse, NextRequest } from 'next/server';
import { parse } from 'csv-parse/sync';
import { authenticateApiRequest } from '@/utils/apiAuth';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * POST /api/reviews/upload
 *
 * Uploads reviews from a CSV file.
 * - Creates review_submissions records
 * - Optionally links to or creates contacts when email/phone is provided
 */

// Valid platforms for reviews
const VALID_PLATFORMS = [
  'Google Business Profile',
  'Yelp',
  'Facebook',
  'TripAdvisor',
  'Trustpilot',
  'Better Business Bureau',
  'G2',
  'Capterra',
  'Clutch',
  'Angi',
  'HomeAdvisor',
  'Houzz',
  'Nextdoor',
  'Thumbtack',
  'Other',
];

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase, error: authError } = await authenticateApiRequest(request);

    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: 401 });
    }

    // Get the proper account ID using the header and validate access
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found or access denied' }, { status: 403 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read and parse the CSV file
    const text = await file.text();

    // Split into lines and clean them
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 0 &&
          line.split(',').some((cell) => cell.trim().length > 0),
      );

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must have a header row and at least one data row' }, { status: 400 });
    }

    // Define expected columns and their aliases
    const expectedColumns: Record<string, string[]> = {
      platform: ['platform'],
      star_rating: ['starrating', 'star rating', 'rating'],
      review_content: ['reviewcontent', 'review content', 'content', 'review'],
      reviewer_first_name: ['reviewerfirstname', 'reviewer first name', 'firstname', 'first name'],
      reviewer_last_name: ['reviewerlastname', 'reviewer last name', 'lastname', 'last name'],
      reviewer_role: ['reviewerrole', 'reviewer role', 'role'],
      reviewer_email: ['revieweremail', 'reviewer email', 'email'],
      reviewer_phone: ['reviewerphone', 'reviewer phone', 'phone'],
      review_date: ['reviewdate', 'review date', 'date', 'createdat', 'created at'],
      location_name: ['location', 'locationname', 'location name'],
    };

    // Parse the CSV with flexible header matching
    const records = parse(lines.join('\n'), {
      columns: (headers: string[]) => {
        // Normalize header: lowercase, remove spaces/underscores
        const normalize = (h: string) => h.toLowerCase().replace(/\s|_/g, '');
        return headers.map((header: string, index: number) => {
          const norm = normalize(header);
          for (const [key, aliases] of Object.entries(expectedColumns)) {
            if (aliases.includes(norm)) return key;
          }
          // Keep extra columns as numbered fields (for location_name overflow)
          return `_extra_${index}`;
        });
      },
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      quote: '"',
      escape: '"',
      delimiter: ',',
      skip_records_with_empty_values: true,
    });

    // Validation and processing
    const errors: string[] = [];
    const reviewsToInsert: any[] = [];
    const contactsToProcess: { reviewIndex: number; email?: string; phone?: string; firstName?: string; lastName?: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because: 1-indexed + header row

      // Clean up record values
      Object.keys(record).forEach((k) => {
        if (record[k] && typeof record[k] === 'string') {
          record[k] = record[k].trim();
        }
      });

      // Validate required fields
      if (!record.platform || record.platform.trim() === '') {
        errors.push(`Row ${rowNumber}: Platform is required`);
        continue;
      }

      if (!record.review_content || record.review_content.trim() === '') {
        errors.push(`Row ${rowNumber}: Review content is required`);
        continue;
      }

      // Validate reviewer identification (at least one of: first_name, email, phone)
      const hasFirstName = record.reviewer_first_name && record.reviewer_first_name.trim();
      const hasEmail = record.reviewer_email && record.reviewer_email.trim();
      const hasPhone = record.reviewer_phone && record.reviewer_phone.trim();

      if (!hasFirstName && !hasEmail && !hasPhone) {
        errors.push(`Row ${rowNumber}: Must have at least one of: reviewer first name, email, or phone`);
        continue;
      }

      // Validate star rating if provided
      let starRating: number | null = null;
      if (record.star_rating) {
        const parsed = parseInt(record.star_rating);
        if (isNaN(parsed) || parsed < 1 || parsed > 5) {
          errors.push(`Row ${rowNumber}: Star rating must be between 1 and 5`);
          continue;
        }
        starRating = parsed;
      }

      // Validate date if provided
      let reviewDate: string = new Date().toISOString();
      if (record.review_date) {
        const parsedDate = new Date(record.review_date);
        if (isNaN(parsedDate.getTime())) {
          errors.push(`Row ${rowNumber}: Invalid date format`);
          continue;
        }
        reviewDate = parsedDate.toISOString();
      }

      // Normalize platform name
      let platform = record.platform.trim();
      const normalizedPlatform = VALID_PLATFORMS.find(
        (p) => p.toLowerCase() === platform.toLowerCase()
      );
      if (normalizedPlatform) {
        platform = normalizedPlatform;
      }

      // Build reviewer name
      const reviewerName = [record.reviewer_first_name, record.reviewer_last_name]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Anonymous';

      // Prepare review record
      reviewsToInsert.push({
        account_id: accountId,
        business_id: accountId, // Legacy field
        platform,
        star_rating: starRating,
        review_content: record.review_content.trim(),
        reviewer_name: reviewerName,
        first_name: record.reviewer_first_name?.trim() || null,
        last_name: record.reviewer_last_name?.trim() || null,
        reviewer_role: record.reviewer_role?.trim() || null,
        email: record.reviewer_email?.trim() || null,
        phone: record.reviewer_phone?.trim() || null,
        location_name: record.location_name?.trim() || null,
        status: 'submitted',
        verified: true, // Manual uploads are trusted
        verified_at: new Date().toISOString(),
        created_at: reviewDate,
        submitted_at: reviewDate,
        review_text_copy: record.review_content.trim(), // For verification matching if needed
        auto_verification_status: 'verified', // Manual = verified
      });

      // Track if we need to link/create contact
      if (hasEmail || hasPhone) {
        contactsToProcess.push({
          reviewIndex: reviewsToInsert.length - 1,
          email: record.reviewer_email?.trim() || undefined,
          phone: record.reviewer_phone?.trim() || undefined,
          firstName: record.reviewer_first_name?.trim() || undefined,
          lastName: record.reviewer_last_name?.trim() || undefined,
        });
      }
    }

    // If all rows had errors, return early
    if (reviewsToInsert.length === 0) {
      return NextResponse.json({
        error: 'No valid reviews to import',
        errors,
      }, { status: 400 });
    }

    // Check for duplicates - fetch existing review content for this account
    const { data: existingReviews } = await supabase
      .from('review_submissions')
      .select('review_content')
      .eq('account_id', accountId);

    const existingContentSet = new Set(
      existingReviews?.map(r => r.review_content?.toLowerCase().trim()).filter(Boolean) || []
    );

    // Filter out duplicates
    const uniqueReviews: typeof reviewsToInsert = [];
    let duplicatesSkipped = 0;

    for (const review of reviewsToInsert) {
      const contentKey = review.review_content?.toLowerCase().trim();
      if (contentKey && existingContentSet.has(contentKey)) {
        duplicatesSkipped++;
      } else {
        uniqueReviews.push(review);
        // Add to set to catch duplicates within the same upload
        if (contentKey) {
          existingContentSet.add(contentKey);
        }
      }
    }

    // If all reviews were duplicates
    if (uniqueReviews.length === 0) {
      return NextResponse.json({
        message: 'No new reviews to import',
        reviewsCreated: 0,
        duplicatesSkipped,
      });
    }

    // Get business_id for this account (required for foreign key constraint)
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('account_id', accountId)
      .limit(1)
      .maybeSingle();

    // Get business locations for this account (for location matching)
    const { data: businessLocations } = await supabase
      .from('business_locations')
      .select('id, name, address_city')
      .eq('account_id', accountId);

    // Create a map for quick location lookup (by name, case-insensitive)
    const locationMap = new Map<string, string>();
    if (businessLocations) {
      for (const loc of businessLocations) {
        if (loc.name) {
          locationMap.set(loc.name.toLowerCase().trim(), loc.id);
        }
        // Also allow matching by city name
        if (loc.address_city) {
          locationMap.set(loc.address_city.toLowerCase().trim(), loc.id);
        }
      }
    }

    // Update all reviews with the correct business_id and try to match locations
    if (business?.id) {
      uniqueReviews.forEach(review => {
        review.business_id = business.id;

        // Try to match location_name to a business_location
        if (review.location_name) {
          const locationKey = review.location_name.toLowerCase().trim();
          const matchedLocationId = locationMap.get(locationKey);
          if (matchedLocationId) {
            review.business_location_id = matchedLocationId;
          }
        }
      });
    } else {
      // Remove business_id if no business exists (field is nullable)
      uniqueReviews.forEach(review => {
        delete review.business_id;
      });
    }

    // Insert reviews
    const { data: insertedReviews, error: insertError } = await supabase
      .from('review_submissions')
      .insert(uniqueReviews)
      .select('id');

    if (insertError) {
      console.error('Error inserting reviews:', insertError);
      console.error('Insert error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      return NextResponse.json({
        error: `Failed to save reviews: ${insertError.message}`,
        details: insertError.details,
        code: insertError.code,
      }, { status: 500 });
    }

    // Process contacts - link existing or create new
    let contactsCreated = 0;
    let contactsLinked = 0;

    for (const contactInfo of contactsToProcess) {
      const review = insertedReviews?.[contactInfo.reviewIndex];
      if (!review) continue;

      try {
        // Try to find existing contact by email or phone
        let existingContact = null;

        if (contactInfo.email) {
          const { data } = await supabase
            .from('contacts')
            .select('id')
            .eq('account_id', accountId)
            .eq('email', contactInfo.email)
            .maybeSingle();
          existingContact = data;
        }

        if (!existingContact && contactInfo.phone) {
          const { data } = await supabase
            .from('contacts')
            .select('id')
            .eq('account_id', accountId)
            .eq('phone', contactInfo.phone)
            .maybeSingle();
          existingContact = data;
        }

        if (existingContact) {
          // Link review to existing contact
          await supabase
            .from('review_submissions')
            .update({ contact_id: existingContact.id })
            .eq('id', review.id);
          contactsLinked++;
        } else {
          // Create new contact
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              account_id: accountId,
              first_name: contactInfo.firstName || '',
              last_name: contactInfo.lastName || '',
              email: contactInfo.email || null,
              phone: contactInfo.phone || null,
              source: 'review_upload',
              status: 'completed', // Already left a review
              category: 'auto-generated-from-review',
              review_verification_status: 'verified',
              review_submission_id: review.id,
            })
            .select('id')
            .single();

          if (!contactError && newContact) {
            // Link review to new contact
            await supabase
              .from('review_submissions')
              .update({ contact_id: newContact.id })
              .eq('id', review.id);
            contactsCreated++;
          }
        }
      } catch (contactErr) {
        console.error('Error processing contact for review:', contactErr);
        // Don't fail the whole upload if contact processing fails
      }
    }

    return NextResponse.json({
      message: 'Successfully uploaded reviews',
      reviewsCreated: insertedReviews?.length || 0,
      duplicatesSkipped,
      contactsCreated,
      contactsLinked,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error processing review upload:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/reviews/upload
 *
 * Returns a CSV template for review uploads
 * Includes user's location names in a comment row if authenticated
 */
export async function GET(request: NextRequest) {
  // Try to get user's locations if authenticated
  let locationNames: string[] = [];
  try {
    const { user, supabase } = await authenticateApiRequest(request);
    if (user) {
      const accountId = await getRequestAccountId(request, user.id, supabase);
      if (accountId) {
        const { data: locations } = await supabase
          .from('business_locations')
          .select('name')
          .eq('account_id', accountId);
        if (locations) {
          locationNames = locations.map(l => l.name).filter(Boolean);
        }
      }
    }
  } catch (e) {
    // Unauthenticated - just provide generic template
  }

  const headers = [
    'platform',
    'star_rating',
    'review_content',
    'reviewer_first_name',
    'reviewer_last_name',
    'reviewer_role',
    'reviewer_email',
    'reviewer_phone',
    'review_date',
    'location',
  ];

  // Build instructions row
  const instructionsRow = locationNames.length > 0
    ? `# Maven multi-location accounts: Your locations are: ${locationNames.join(', ')}. Use these names in the "location" column to link reviews to a location.`
    : '# Leave the "location" column blank unless you have a Maven account with multiple locations.';

  const exampleRows = [
    [
      'Google Business Profile',
      '5',
      '"Excellent service! The team was professional and thorough. Highly recommend."',
      'John',
      'Smith',
      'Customer',
      'john@example.com',
      '555-123-4567',
      '2024-01-15',
      locationNames[0] || 'Downtown Store',
    ],
    [
      'Yelp',
      '4',
      '"Great experience overall. Quick response time and fair pricing."',
      'Jane',
      'Doe',
      'Client',
      '',
      '555-987-6543',
      '2024-01-10',
      '',
    ],
    [
      'Facebook',
      '5',
      '"I\'ve been using their services for years. Always reliable!"',
      'Bob',
      '',
      '',
      'bob@example.com',
      '',
      '2024-02-01',
      '"Vancouver, WA 98661"',
    ],
  ];

  const csvContent = [
    instructionsRow,
    headers.join(','),
    ...exampleRows.map((row) => row.join(',')),
  ].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="review-upload-template.csv"',
    },
  });
}
