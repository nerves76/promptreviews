import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';

export async function POST(request: NextRequest) {
  try {
    // Try to get auth from Authorization header first (for client-side calls)
    const authHeader = request.headers.get('Authorization');
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use the token from the client
      const token = authHeader.slice(7);
      const supabaseAdmin = createServiceRoleClient();
      
      // Verify the token and get the user
      const { data: userData, error: verifyError } = await supabaseAdmin.auth.getUser(token);
      if (!verifyError && userData.user) {
        user = userData.user;
      }
    }
    
    // Fallback to server-side cookie-based auth
    if (!user) {
      const supabase = await createServerSupabaseClient();
      const { data: { user: cookieUser }, error: userError } = await supabase.auth.getUser();
      
      if (!userError && cookieUser) {
        user = cookieUser;
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    
    // Use service role client for database operations
    const supabaseAdmin = createServiceRoleClient();
    
    // First check if there's an account_users record
    const { data: accountUserRecord, error: accountUserError } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .single();
    
    // If there's an account_users record, use that account_id to check for the account
    const accountIdToCheck = accountUserRecord?.account_id || user.id;
    
    
    // Check if account exists (including soft-deleted ones)
    const { data: existingAccount, error: checkError } = await supabaseAdmin
      .from('accounts')
      .select('id, deleted_at, plan, stripe_customer_id, trial_start, trial_end')
      .eq('id', accountIdToCheck)
      .maybeSingle();
    
    if (existingAccount) {
      // Check if account was previously deleted
      if (existingAccount.deleted_at) {
        
        // Reactivate the account but don't give a new trial
        const { error: reactivateError } = await supabaseAdmin
          .from('accounts')
          .update({
            deleted_at: null,
            plan: 'no_plan', // Force them to select a paid plan
            // Keep original trial dates - no new trial!
            // Don't update trial_start or trial_end
          })
          .eq('id', user.id);
          
        if (reactivateError) {
          console.error('❌ Error reactivating account:', reactivateError);
          return NextResponse.json(
            { error: 'Failed to reactivate account' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Account reactivated (no trial available)',
          accountId: existingAccount.id,
          isReactivation: true,
          hadPreviousTrial: true
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Account already exists',
        accountId: existingAccount.id 
      });
    }
    
    // If there's an orphaned account_users record, we need to handle it differently
    if (accountUserRecord && !existingAccount) {
      
      // Create account with the ID from account_users record
      const { data: newAccount, error: createError } = await supabaseAdmin
        .from('accounts')
        .insert({
          id: accountIdToCheck,
          user_id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          plan: 'no_plan',
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          is_free_account: false,
          custom_prompt_page_count: 0,
          contact_count: 0,
          review_notifications_enabled: true,
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating account for orphaned record:', createError);
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        );
      }
      
      
      return NextResponse.json({ 
        success: true, 
        message: 'Account created for orphaned record',
        accountId: newAccount.id 
      });
    }
    
    // Create account if it doesn't exist (normal flow)
    
    const { data: newAccount, error: createError } = await supabaseAdmin
      .from('accounts')
      .insert({
        id: user.id,
        user_id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        plan: 'no_plan',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_free_account: false,
        custom_prompt_page_count: 0,
        contact_count: 0,
        review_notifications_enabled: true,
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating account:', createError);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }
    
    // Create account_users link
    const { error: linkError } = await supabaseAdmin
      .from('account_users')
      .insert({
        account_id: user.id,
        user_id: user.id,
        role: 'owner',
        created_at: new Date().toISOString()
      });
    
    if (linkError) {
      console.error('❌ Account user link error:', linkError);
    }
    
    
    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully',
      accountId: newAccount.id 
    });
    
  } catch (error) {
    console.error('❌ Ensure account exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}