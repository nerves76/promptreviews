/**
 * Test script to check if a user exists in the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testUserExists() {
  try {
    const email = 'nerves76@gmail.com';
    
    console.log('Testing user lookup for:', email);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Use listUsers for user lookup
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ email });
    
    if (usersError) {
      console.error('User lookup error:', usersError);
      return;
    }
    
    const user = usersData?.users?.find((u) => u.email === email);
    
    if (!user) {
      console.log('User not found.');
    } else {
      console.log('User found:', user.id, user.email, 'Confirmed:', user.email_confirmed_at);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testUserExists(); 