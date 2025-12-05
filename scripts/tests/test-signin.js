#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignIn() {
  console.log('🔐 Testing sign in for chris@diviner.agency...');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'chris@diviner.agency',
    password: 'Prcamus9721!'
  });
  
  if (error) {
    console.error('❌ Sign in failed:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code
    });
  } else {
    console.log('✅ Sign in successful!');
    console.log('User:', data.user?.email);
    console.log('User ID:', data.user?.id);
    console.log('Session:', data.session ? 'Active' : 'No session');
  }
}

testSignIn();
