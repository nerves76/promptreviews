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
    // Environment sanity checks to produce clear local error messages
    const missingEnv: string[] = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingEnv.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingEnv.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnv.push('SUPABASE_SERVICE_ROLE_KEY');
    if (missingEnv.length > 0) {
      return NextResponse.json(
        { 
          error: 'Supabase environment variables are missing',
          details: {
            missing: missingEnv,
            hint: 'Ensure .env.local contains these keys and restart the dev server.'
          }
        },
        { status: 500 }
      );
    }

    // Use service role client to create user without email confirmation
    const supabase = createServiceRoleClient();
    
    // Don't check for existing users - let Supabase handle this automatically
    // The createUser call will fail if user already exists, which is the desired behavior
    
    // Create user with service role (bypasses email confirmation)
    // Note: We set confirmed_at to ensure the trigger fires immediately
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
      console.error('❌ Signup error:', JSON.stringify(error, null, 2));
      
      // Extract error message from various possible formats
      const errorMessage = error.message || (error as any).msg || (error as any).error_description || error.toString();
      
      // Handle specific errors
      if (errorMessage && (errorMessage.includes('already registered') || errorMessage.includes('already exists'))) {
        return NextResponse.json(
          { error: 'User already registered. Please sign in instead.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: errorMessage || 'Failed to create account' },
        { status: 400 }
      );
    }
    
    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      );
    }
    
    
    // The database trigger should create the account, but it may not fire with admin.createUser
    // Wait briefly for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const userId = data.user.id;

    // Verify the trigger created the account successfully
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingAccount) {
      console.log('⚠️ Trigger did not create account, creating manually for user:', userId);

      // Create account manually since trigger didn't fire
      // This is safe because we check for existence first
      const { error: accountError } = await supabase
        .from('accounts')
        .insert({
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          plan: 'no_plan',
          trial_start: null,
          trial_end: null,
          is_free_account: false,
          has_had_paid_plan: false,
          custom_prompt_page_count: 0,
          contact_count: 0,
          review_notifications_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (accountError && accountError.code !== '23505') { // Ignore duplicate key errors
        console.error('❌ Failed to create account:', accountError);
        // Delete the user since account creation failed
        await supabase.auth.admin.deleteUser(userId);

        return NextResponse.json(
          { error: 'Failed to create account. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    // ALWAYS ensure account_users link exists, regardless of how account was created
    
    // Check if account_users link already exists
    const { data: existingLink } = await supabase
      .from('account_users')
      .select('*')
      .eq('account_id', userId)
      .eq('user_id', userId)
      .single();
    
    if (!existingLink) {
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
        
        // This is critical - without this link, user can't access their account
        // Try to clean up and fail the signup
        if (linkError.code !== '23505') { // Unless it's a duplicate key error
          await supabase.auth.admin.deleteUser(userId);
          
          return NextResponse.json(
            { error: 'Failed to complete account setup. Please try again.' },
            { status: 500 }
          );
        }
      } else {
      }
    } else {
    }
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now sign in.',
      user: {
        id: data.user.id,
        email: data.user.email,
      }
    });
    
  } catch (error: any) {
    // Prefer explicit message; JSON.stringify(Error) is often {}
    const errorMessage = (error && error.message) ? error.message : (typeof error === 'string' ? error : 'Internal server error');
    console.error('❌ Signup exception:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
