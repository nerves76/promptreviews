import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }
    
    console.log('🔧 Manually fixing account for user:', userId);
    
    const supabase = createServiceRoleClient();
    
    // First, get the user details
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = userData.user;
    console.log('👤 User found:', { id: user.id, email: user.email, metadata: user.user_metadata });
    
    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (existingAccount) {
      return NextResponse.json({
        success: true,
        message: 'Account already exists',
        account: existingAccount
      });
    }
    
    // Create account record
    const { data: newAccount, error: accountError } = await supabase
      .from('accounts')
      .insert({
        id: userId,
        user_id: userId,
        email: user.email,
        first_name: user.user_metadata?.first_name || 'User',
        last_name: user.user_metadata?.last_name || 'Name',
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
    
    if (accountError) {
      console.error('❌ Account creation error:', accountError);
      return NextResponse.json(
        { error: 'Failed to create account: ' + accountError.message },
        { status: 400 }
      );
    }
    
    console.log('✅ Account created:', newAccount);
    
    // Create account_users link
    const { error: linkError } = await supabase
      .from('account_users')
      .insert({
        account_id: userId,
        user_id: userId,
        role: 'owner',
        created_at: new Date().toISOString()
      });
    
    if (linkError) {
      console.error('❌ Account user link error:', linkError);
      return NextResponse.json(
        { error: 'Account created but failed to create user link: ' + linkError.message },
        { status: 400 }
      );
    }
    
    console.log('✅ Account user link created');
    
    return NextResponse.json({
      success: true,
      message: 'Account created and linked successfully',
      account: newAccount
    });
    
  } catch (error) {
    console.error('❌ Fix account exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}