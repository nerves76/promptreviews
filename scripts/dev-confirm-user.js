#!/usr/bin/env node

/**
 * Development utility to manually confirm users and bypass broken email confirmation
 * Usage: node scripts/dev-confirm-user.js <email>
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmUser(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Get the user by email
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('❌ Error fetching users:', getUserError);
      return;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ No user found with email: ${email}`);
      console.log('Available users:');
      users.users.forEach(u => console.log(`  - ${u.email} (${u.id})`));
      return;
    }
    
    console.log(`✅ Found user: ${user.email} (${user.id})`);
    console.log(`📧 Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    
    if (user.email_confirmed_at) {
      console.log('ℹ️  User is already confirmed');
      return;
    }
    
    // Update user to confirm email
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true
      }
    );
    
    if (updateError) {
      console.error('❌ Error confirming user:', updateError);
      return;
    }
    
    console.log('🎉 User email confirmed successfully!');
    console.log(`✅ ${updatedUser.user.email} is now confirmed`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/dev-confirm-user.js <email>');
  process.exit(1);
}

confirmUser(email); 