import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrMock, createClient } from '@/utils/supabaseClient';
import { getAccountIdForUser } from '@/utils/accountUtils';

export async function GET(request: NextRequest) {
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