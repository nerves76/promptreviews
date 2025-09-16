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

async function listUsers() {
  console.log('📋 Listing all users in accounts table...\n');
  
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, email, first_name, last_name, created_at, is_admin')
      .order('email');

    if (error) {
      console.error('❌ Error listing users:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No users found in accounts table.');
      return;
    }

    console.log(`Found ${data.length} user(s):`);
    console.log('─'.repeat(80));
    
    data.forEach(user => {
      const name = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}`
        : 'No name';
      const created = new Date(user.created_at).toLocaleDateString();
      const adminStatus = user.is_admin ? ' (ADMIN)' : '';
      console.log(`✓ ${user.email}${adminStatus}`);
      console.log(`  Name: ${name}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Created: ${created}`);
      console.log();
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

listUsers(); 