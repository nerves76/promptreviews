#!/usr/bin/env node

/**
 * Script to update user password in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updatePassword() {
  try {
    // First, let's find your user by email
    const userEmail = 'chris@diviner.agency'; // Your email
    const newPassword = 'Prcamus9721!';
    
    console.log(`🔐 Updating password for user: ${userEmail}`);
    
    // Get the user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      process.exit(1);
    }
    
    const user = users.find(u => u.email === userEmail);
    
    if (!user) {
      console.error(`❌ User not found with email: ${userEmail}`);
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.id}`);
    
    // Update the password
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );
    
    if (error) {
      console.error('❌ Error updating password:', error);
      process.exit(1);
    }
    
    console.log('✅ Password updated successfully!');
    console.log('📝 New password: Prcamus9721!');
    console.log('');
    console.log('You can now log in with:');
    console.log(`  Email: ${userEmail}`);
    console.log(`  Password: Prcamus9721!`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the update
updatePassword();