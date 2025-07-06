#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listAuthUsers() {
  console.log('📋 Listing all users in auth.users table...\n');
  
  try {
    const { data, error } = await supabase
      .from('auth.users')
      .select('id, email, created_at, email_confirmed_at')
      .order('email');

    if (error) {
      console.error('❌ Error listing auth users:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No users found in auth.users table.');
      return;
    }

    console.log(`Found ${data.length} user(s) in auth.users:`);
    console.log('─'.repeat(80));
    
    data.forEach(user => {
      const created = new Date(user.created_at).toLocaleDateString();
      const confirmed = user.email_confirmed_at ? '✅ Confirmed' : '❌ Not confirmed';
      console.log(`✓ ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Created: ${created}`);
      console.log(`  Status: ${confirmed}`);
      console.log();
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

listAuthUsers(); 