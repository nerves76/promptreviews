/**
 * Script to check locations for a specific user account
 * Usage: node scripts/check-user-locations.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserLocations() {
  try {
    console.log('🔍 Checking for user locations...');
    
    // First, find the user account
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
    
    // Find the account for this user
    const { data: accountUsers, error: accountUserError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', targetUser.id);
    
    if (accountUserError) {
      console.error('❌ Error fetching account users:', accountUserError);
      return;
    }
    
    if (!accountUsers || accountUsers.length === 0) {
      console.log('❌ No account found for user');
      return;
    }
    
    const accountId = accountUsers[0].account_id;
    console.log(`✅ Found account: ${accountId}`);
    
    // Get locations for this account
    const { data: locations, error: locationError } = await supabase
      .from('business_locations')
      .select(`
        *,
        prompt_pages!business_location_id(*)
      `)
      .eq('account_id', accountId);
    
    if (locationError) {
      console.error('❌ Error fetching locations:', locationError);
      return;
    }
    
    console.log(`📊 Found ${locations.length} locations for account ${accountId}:`);
    
    locations.forEach((location, index) => {
      console.log(`\n📍 Location ${index + 1}: ${location.name}`);
      console.log(`   ID: ${location.id}`);
      console.log(`   prompt_page_slug: ${location.prompt_page_slug || 'NULL'}`);
      console.log(`   prompt_page_id: ${location.prompt_page_id || 'NULL'}`);
      console.log(`   Associated prompt pages: ${location.prompt_pages?.length || 0}`);
      
      if (location.prompt_pages && location.prompt_pages.length > 0) {
        location.prompt_pages.forEach((page, pageIndex) => {
          console.log(`     Prompt page ${pageIndex + 1}: ${page.slug} (ID: ${page.id})`);
        });
      }
    });
    
    // Check for locations without prompt_page_slug
    const locationsWithoutSlug = locations.filter(loc => !loc.prompt_page_slug);
    console.log(`\n⚠️  Locations without prompt_page_slug: ${locationsWithoutSlug.length}`);
    
    if (locationsWithoutSlug.length > 0) {
      locationsWithoutSlug.forEach(location => {
        console.log(`   - ${location.name} (ID: ${location.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkUserLocations(); 