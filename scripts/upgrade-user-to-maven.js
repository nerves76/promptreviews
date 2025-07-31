/**
 * Script to upgrade a user to Maven plan
 * Usage: node scripts/upgrade-user-to-maven.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Environment check:');
console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function upgradeUserToMaven() {
  const targetEmail = 'chris@diviner.agency';
  
  try {
    console.log(`🔍 Looking up user: ${targetEmail}`);
    
    // First, find the user in auth.users
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }
    
    const targetUser = user.users.find(u => u.email === targetEmail);
    
    if (!targetUser) {
      console.error(`❌ User not found: ${targetEmail}`);
      return;
    }
    
    console.log(`✅ Found user: ${targetUser.email} (ID: ${targetUser.id})`);
    
    // Find the account for this user
    const { data: accountUsers, error: accountUsersError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('user_id', targetUser.id);
    
    if (accountUsersError) {
      console.error('❌ Error fetching account users:', accountUsersError);
      return;
    }
    
    if (!accountUsers || accountUsers.length === 0) {
      console.error(`❌ No account found for user: ${targetEmail}`);
      return;
    }
    
    const accountUser = accountUsers[0];
    console.log(`✅ Found account: ${accountUser.account_id} (Role: ${accountUser.role})`);
    
    // Update the account to Maven plan
    const { data: updatedAccount, error: updateError } = await supabase
      .from('accounts')
      .update({
        plan: 'maven',
        plan_lookup_key: 'maven',
        updated_at: new Date().toISOString()
      })
      .eq('id', accountUser.account_id)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating account:', updateError);
      return;
    }
    
    console.log('✅ Successfully upgraded account to Maven plan');
    console.log('📊 Account details:', updatedAccount[0]);
    
    // Also update the account limits for Maven
    const { error: limitsError } = await supabase
      .from('accounts')
      .update({
        custom_prompt_page_count: 10, // Maven limit
        contact_count: 1000, // Maven limit
        location_count: 10, // Maven limit
        updated_at: new Date().toISOString()
      })
      .eq('id', accountUser.account_id);
    
    if (limitsError) {
      console.error('❌ Error updating account limits:', limitsError);
      return;
    }
    
    console.log('✅ Successfully updated account limits for Maven plan');
    console.log('🎉 User upgrade completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the upgrade
upgradeUserToMaven()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 