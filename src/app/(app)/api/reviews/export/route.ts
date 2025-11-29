import { NextResponse, NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/utils/apiAuth';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * GET /api/reviews/export
 *
 * Exports all reviews for the current account as a CSV file.
 * The CSV format is compatible with the review upload template.
 */
export async function GET(request: NextRequest) {
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

    // Fetch all reviews for this account
    const { data: reviews, error: fetchError } = await supabase
      .from('review_submissions')
      .select(`
        platform,
        star_rating,
        review_content,
        first_name,
        last_name,
        reviewer_role,
        email,
        phone,
        status,
        verified,
        created_at,
        location_name,
        imported_from_google
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching reviews for export:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // CSV headers - match the upload template format
    const headers = [
      'platform',
      'star_rating',
      'review_content',
      'reviewer_first_name',
      'reviewer_last_name',
      'reviewer_role',
      'reviewer_email',
      'reviewer_phone',
      'status',
      'verified',
      'review_date',
      'location_name',
      'imported_from_google',
    ];

    // Escape CSV field - handle quotes and commas
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const str = String(value);
      // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV rows
    const rows = reviews?.map((review: {
      platform: string;
      star_rating: number | null;
      review_content: string | null;
      first_name: string | null;
      last_name: string | null;
      reviewer_role: string | null;
      email: string | null;
      phone: string | null;
      status: string;
      verified: boolean;
      created_at: string | null;
      location_name: string | null;
      imported_from_google: boolean;
    }) => [
      escapeCSV(review.platform),
      escapeCSV(review.star_rating),
      escapeCSV(review.review_content),
      escapeCSV(review.first_name),
      escapeCSV(review.last_name),
      escapeCSV(review.reviewer_role),
      escapeCSV(review.email),
      escapeCSV(review.phone),
      escapeCSV(review.status),
      escapeCSV(review.verified ? 'Yes' : 'No'),
      escapeCSV(review.created_at ? new Date(review.created_at).toISOString().split('T')[0] : ''),
      escapeCSV(review.location_name),
      escapeCSV(review.imported_from_google ? 'Yes' : 'No'),
    ].join(',')) || [];

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Return as CSV file download
    const filename = `reviews-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error in reviews export:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
