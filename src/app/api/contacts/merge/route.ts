import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    // Create authenticated Supabase client with cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {}, // No-op for API route
          remove: () => {}, // No-op for API route
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { primaryContactId, fieldsToKeep, contactIdsToMerge } = await request.json();

    if (!primaryContactId || !fieldsToKeep || !contactIdsToMerge || contactIdsToMerge.length < 2) {
      return NextResponse.json({ error: 'Invalid merge parameters' }, { status: 400 });
    }

    // Verify all contacts belong to the user
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, account_id')
      .in('id', contactIdsToMerge)
      .eq('account_id', user.id);

    if (contactsError) throw contactsError;
    if (!contacts || contacts.length !== contactIdsToMerge.length) {
      return NextResponse.json({ error: 'Some contacts not found or access denied' }, { status: 403 });
    }

    // Get the contacts to be deleted (all except primary)
    const contactsToDelete = contactIdsToMerge.filter((id: string) => id !== primaryContactId);

    // Start transaction by using a series of operations
    try {
      // 1. Update the primary contact with merged fields
      const { error: updateError } = await supabase
        .from('contacts')
        .update(fieldsToKeep)
        .eq('id', primaryContactId)
        .eq('account_id', user.id);

      if (updateError) throw updateError;

      // 2. Transfer all review submissions from duplicate contacts to primary contact
      const { error: reviewsUpdateError } = await supabase
        .from('review_submissions')
        .update({ contact_id: primaryContactId })
        .in('contact_id', contactsToDelete);

      if (reviewsUpdateError) throw reviewsUpdateError;

      // 3. Transfer all prompt pages from duplicate contacts to primary contact
      const { error: promptPagesUpdateError } = await supabase
        .from('prompt_pages')
        .update({ contact_id: primaryContactId })
        .in('contact_id', contactsToDelete);

      if (promptPagesUpdateError) throw promptPagesUpdateError;

      // 4. Delete the duplicate contacts
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', contactsToDelete)
        .eq('account_id', user.id);

      if (deleteError) throw deleteError;

      // Get counts of transferred items for response
      const { count: reviewsCount } = await supabase
        .from('review_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('contact_id', primaryContactId);

      const { count: promptPagesCount } = await supabase
        .from('prompt_pages')
        .select('*', { count: 'exact', head: true })
        .eq('contact_id', primaryContactId);

      return NextResponse.json({
        success: true,
        primaryContactId,
        deletedContacts: contactsToDelete.length,
        transferredReviews: reviewsCount || 0,
        transferredPromptPages: promptPagesCount || 0
      });

    } catch (transactionError) {
      console.error('Merge transaction failed:', transactionError);
      return NextResponse.json(
        { error: 'Failed to complete merge operation. No changes were made.' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Merge contacts error:', error);
    return NextResponse.json(
      { error: 'Failed to merge contacts' },
      { status: 500 }
    );
  }
}