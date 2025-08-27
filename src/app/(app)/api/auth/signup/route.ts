import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();
    
    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Basic validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    console.log('🔧 Server-side signup for:', email);
    
    // Use service role client to create user without email confirmation
    const supabase = createServiceRoleClient();
    
    // Don't check for existing users - let Supabase handle this automatically
    // The createUser call will fail if user already exists, which is the desired behavior
    
    // Create user with service role (bypasses email confirmation)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });
    
    if (error) {
      console.error('❌ Signup error:', error);
      
      // Handle specific errors
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'User already registered. Please sign in instead.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to create account' },
        { status: 400 }
      );
    }
    
    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      );
    }
    
    console.log('✅ User created successfully:', data.user.id);
    
    // Wait a moment for trigger to potentially create account
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if account was created by trigger
    const userId = data.user.id;
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (!existingAccount) {
      console.log('🔧 Creating account manually (trigger didn\'t fire)...');
      
      try {
        // Create account manually
        const { error: accountError } = await supabase
          .from('accounts')
          .insert({
            id: userId,
            user_id: userId,
            email,
            first_name: firstName,
            last_name: lastName,
            plan: 'no_plan',
            trial_start: new Date().toISOString(),
            trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            is_free_account: false,
            custom_prompt_page_count: 0,
            contact_count: 0,
            review_notifications_enabled: true,
          });
        
        if (accountError) {
          console.error('❌ Account creation error:', accountError);
          
          // If it's a unique constraint error, the account might already exist
          if (accountError.code === '23505') {
            console.log('Account may already exist, continuing...');
          } else {
            // For other errors, we should fail the signup
            // Delete the user since account creation failed
            await supabase.auth.admin.deleteUser(userId);
            
            return NextResponse.json(
              { error: 'Failed to create account. Please try again.' },
              { status: 500 }
            );
          }
        } else {
          console.log('✅ Account created manually');
          
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
          } else {
            console.log('✅ Account user link created');
          }
        }
      } catch (accountCreationError) {
        console.error('❌ Account creation exception:', accountCreationError);
        // Don't fail the signup - user is still created
      }
    } else {
      console.log('✅ Account already exists from trigger');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now sign in.',
      user: {
        id: data.user.id,
        email: data.user.email,
      }
    });
    
  } catch (error) {
    console.error('❌ Signup exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}