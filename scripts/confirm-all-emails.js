/**
 * Confirm All User Emails Script
 * 
 * This script manually confirms all existing user emails in the database
 * since we've disabled email confirmation for local development.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function confirmAllEmails() {
  try {
    console.log('🔍 Confirming all user emails...');
    
    // Get all users
    const { data, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error listing users:', usersError);
      return;
    }
    
    const users = data?.users || [];
    console.log(`📊 Found ${users.length} users`);
    
    let confirmedCount = 0;
    
    for (const user of users) {
      console.log(`👤 Processing user: ${user.email} (${user.email_confirmed_at ? 'already confirmed' : 'not confirmed'})`);
      
      if (!user.email_confirmed_at) {
        // Update user to confirm email
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            email_confirmed_at: new Date().toISOString(),
            email_confirm_token: null
          }
        );
        
        if (updateError) {
          console.error(`❌ Failed to confirm email for ${user.email}:`, updateError);
        } else {
          console.log(`✅ Confirmed email for ${user.email}`);
          confirmedCount++;
        }
      }
    }
    
    console.log(`\n🎉 Email confirmation complete!`);
    console.log(`✅ Confirmed ${confirmedCount} new users`);
    console.log(`📊 Total users: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error confirming emails:', error);
  }
}

confirmAllEmails(); 