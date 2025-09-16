/**
 * Script to fix location limits for Maven user
 * Usage: node scripts/fix-location-limits.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixLocationLimits() {
  try {
    console.log('🔧 Fixing location limits for Maven user...');
    
    // Find the user
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }
    
    const targetUser = users.users.find(user => user.email === 'chris@diviner.agency');
    
    if (!targetUser) {
      console.log('❌ User chris@diviner.agency not found');
      return;
    }
    
    console.log(`✅ Found user: ${targetUser.email} (ID: ${targetUser.id})`);
    
    // Find the account
    const { data: accountUsers, error: accountUserError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', targetUser.id);
    
    if (accountUserError || !accountUsers || accountUsers.length === 0) {
      console.log('❌ No account found for user');
      return;
    }
    
    const accountId = accountUsers[0].account_id;
    console.log(`✅ Found account: ${accountId}`);
    
    // Get current account data
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    if (accountError) {
      console.error('❌ Error fetching account:', accountError);
      return;
    }
    
    console.log('📊 Current account limits:');
    console.log(`   Plan: ${account.plan}`);
    console.log(`   Max locations: ${account.max_locations || 'NULL'}`);
    console.log(`   Location count: ${account.location_count || 'NULL'}`);
    console.log(`   Max contacts: ${account.max_contacts || 'NULL'}`);
    console.log(`   Max prompt pages: ${account.max_prompt_pages || 'NULL'}`);
    
    // Update account with proper Maven limits
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        plan: 'maven',
        max_locations: 10,
        location_count: 0, // Reset to 0 so you can create new locations
        max_contacts: 1000,
        max_prompt_pages: 1000,
        is_free_account: false,
        has_had_paid_plan: true,
        plan_lookup_key: 'maven',
      })
      .eq('id', accountId);
    
    if (updateError) {
      console.error('❌ Error updating account:', updateError);
      return;
    }
    
    console.log('\n✅ Successfully updated account limits!');
    console.log('📊 New limits:');
    console.log('   Plan: Maven');
    console.log('   Max locations: 10');
    console.log('   Location count: 0 (reset)');
    console.log('   Max contacts: 1000');
    console.log('   Max prompt pages: 1000');
    console.log('\n🎉 You can now create up to 10 locations!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixLocationLimits(); 