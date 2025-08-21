import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    console.log('🔧 Ensuring account exists for user:', user.id);
    
    // Check if account exists
    const { data: existingAccount, error: checkError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (existingAccount) {
      console.log('✅ Account already exists:', existingAccount.id);
      return NextResponse.json({ 
        success: true, 
        message: 'Account already exists',
        accountId: existingAccount.id 
      });
    }
    
    // Create account if it doesn't exist
    console.log('🔧 Creating account for user:', user.id);
    
    const { data: newAccount, error: createError } = await supabase
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
    const { error: linkError } = await supabase
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
    
    console.log('✅ Account created successfully:', newAccount.id);
    
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