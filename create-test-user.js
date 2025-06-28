/**
 * Create Test User Script
 * This script helps create a test user in Supabase auth for development
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestUser() {
  console.log('🔐 Creating test user...\n');

  try {
    // Test credentials
    const email = 'testuser@example.com';
    const password = 'testpassword123';

    console.log('1. Attempting to create user with email:', email);

    // First, try to sign up a new user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`
      }
    });

    if (signUpError) {
      console.log('❌ Sign up error:', signUpError.message);
      
      // If user already exists, try to sign in
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️  User already exists, attempting to sign in...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.log('❌ Sign in error:', signInError.message);
          console.log('\n💡 Try these solutions:');
          console.log('1. Use the "Forgot your password?" link to reset the password');
          console.log('2. Use Google/GitHub OAuth instead');
          console.log('3. Check if the user exists in your Supabase dashboard');
          return;
        }

        console.log('✅ Successfully signed in existing user:', signInData.user.email);
        console.log('User ID:', signInData.user.id);
        return;
      }
      
      console.log('\n💡 Try these solutions:');
      console.log('1. Check your Supabase project settings');
      console.log('2. Verify your environment variables');
      console.log('3. Use Google/GitHub OAuth instead');
      return;
    }

    if (signUpData.user) {
      console.log('✅ User created successfully!');
      console.log('Email:', signUpData.user.email);
      console.log('User ID:', signUpData.user.id);
      
      if (signUpData.user.email_confirmed_at) {
        console.log('✅ Email already confirmed');
      } else {
        console.log('⚠️  Email confirmation required');
        console.log('Check your email for confirmation link');
      }
      
      console.log('\n📝 Test credentials:');
      console.log('Email:', email);
      console.log('Password:', password);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createTestUser(); 