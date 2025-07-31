/**
 * Script to check account limits for a user
 * Usage: node scripts/check-account-limits.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAccountLimits() {
  const targetEmail = 'chris@diviner.agency';
  
  try {
    console.log(`🔍 Checking account limits for: ${targetEmail}`);
    
    // Find the user
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
    
    // Get account info
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', targetUser.id)
      .single();
    
    if (accountError) {
      console.error('❌ Error fetching account:', accountError);
      return;
    }
    
    console.log('📊 Account Details:');
    console.log('  Plan:', account.plan);
    console.log('  Plan Lookup Key:', account.plan_lookup_key);
    console.log('  Location Count:', account.location_count);
    console.log('  Max Locations:', account.max_locations);
    console.log('  Custom Prompt Page Count:', account.custom_prompt_page_count);
    console.log('  Contact Count:', account.contact_count);
    
    // Check if can create more locations
    const canCreateMore = account.location_count < account.max_locations;
    console.log('  Can Create More Locations:', canCreateMore);
    
    // Get actual locations count
    const { data: locations, error: locationsError } = await supabase
      .from('business_locations')
      .select('id, name')
      .eq('account_id', targetUser.id)
      .eq('is_active', true);
    
    if (locationsError) {
      console.error('❌ Error fetching locations:', locationsError);
      return;
    }
    
    console.log('  Actual Locations Count:', locations?.length || 0);
    console.log('  Location Names:', locations?.map(l => l.name) || []);
    
    // Check the issue
    if (account.max_locations === 0) {
      console.log('❌ ISSUE: max_locations is 0! This should be 10 for Maven plan.');
    } else if (account.location_count >= account.max_locations) {
      console.log('❌ ISSUE: Location limit reached');
    } else {
      console.log('✅ Should be able to create locations');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkAccountLimits()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 