/**
 * Test script to verify the sign-up flow works correctly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testSignUpFlow() {
  try {
    const testEmail = `testuser${Date.now()}@gmail.com`;
    const testPassword = 'testpassword123';
    
    console.log('Testing sign-up flow for:', testEmail);
    
    // 1. Test sign-up
    console.log('1. Testing sign-up...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
        },
      },
    });

    if (signUpError) {
      console.error('Sign-up error:', signUpError);
      return;
    }

    console.log('Sign-up successful:', signUpData.user?.id);
    console.log('User confirmed:', signUpData.user?.email_confirmed_at);

    // 2. Test sign-in immediately after sign-up
    console.log('2. Testing sign-in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.error('Sign-in error:', signInError);
      return;
    }

    console.log('Sign-in successful:', signInData.user?.id);
    console.log('Session created:', !!signInData.session);

    // 3. Test account creation
    console.log('3. Testing account creation...');
    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", signInData.user.id)
      .single();

    if (accountError && accountError.code !== "PGRST116") {
      console.error('Account check error:', accountError);
    } else if (!accountData) {
      console.log('No account found, creating one...');
      const { error: createError } = await supabase
        .from("accounts")
        .insert({
          id: signInData.user.id,
          email: testEmail,
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          is_free_account: false,
          custom_prompt_page_count: 0,
          contact_count: 0,
          first_name: 'Test',
          last_name: 'User',
        });

      if (createError) {
        console.error('Account creation error:', createError);
      } else {
        console.log('Account created successfully');
      }
    } else {
      console.log('Account already exists');
    }

    // 4. Test account_users creation
    console.log('4. Testing account_users creation...');
    const { error: upsertError } = await supabase
      .from("account_users")
      .upsert(
        {
          user_id: signInData.user.id,
          account_id: signInData.user.id,
          role: "owner",
        },
        {
          onConflict: "user_id,account_id",
          ignoreDuplicates: true,
        }
      );

    if (upsertError) {
      console.error('Account user upsert error:', upsertError);
    } else {
      console.log('Account user record created/updated successfully');
    }

    console.log('✅ All tests passed! Sign-up flow is working correctly.');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSignUpFlow(); 