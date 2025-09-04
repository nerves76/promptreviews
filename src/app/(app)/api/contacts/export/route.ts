import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrMock, createClient, createServiceRoleClient } from '@/auth/providers/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const supabaseAdmin = createServiceRoleClient();
    
    // Get authenticated user
    const { data: { session }, error: sessionError } = await getSessionOrMock(supabase);
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account ID from query parameters
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    
    if (!accountId) {
      return NextResponse.json({ error: 'account_id query parameter is required' }, { status: 400 });
    }
    
    // Validate user has access to this account
    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', session.user.id)
      .eq('account_id', accountId)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'Access denied to this account' }, { status: 403 });
    }

    // Fetch all contacts for the user's account
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    // Generate CSV content
    const csvHeaders = [
      'First Name',
      'Last Name', 
      'Email',
      'Phone',
      'Business Name',
      'Role',
      'Address Line 1',
      'Address Line 2',
      'City',
      'State',
      'Postal Code',
      'Country',
      'Category',
      'Status',
      'Notes',
      'Created At'
    ];

    // Helper function to escape CSV fields
    const escapeCsvField = (field: any) => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Generate CSV rows
    const csvRows = [
      csvHeaders.join(','),
      ...contacts.map(contact => [
        escapeCsvField(contact.first_name),
        escapeCsvField(contact.last_name),
        escapeCsvField(contact.email),
        escapeCsvField(contact.phone),
        escapeCsvField(contact.business_name),
        escapeCsvField(contact.role),
        escapeCsvField(contact.address_line1),
        escapeCsvField(contact.address_line2),
        escapeCsvField(contact.city),
        escapeCsvField(contact.state),
        escapeCsvField(contact.postal_code),
        escapeCsvField(contact.country),
        escapeCsvField(contact.category),
        escapeCsvField(contact.status),
        escapeCsvField(contact.notes),
        escapeCsvField(contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '')
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `contacts-${currentDate}.csv`;

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 