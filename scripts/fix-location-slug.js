/**
 * Simple script to fix the location by updating it with the existing prompt page slug
 * Usage: node scripts/fix-location-slug.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixLocationSlug() {
  try {
    console.log('🔧 Fixing location slug...');
    
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
    
    // Get the location
    const { data: locations, error: locationError } = await supabase
      .from('business_locations')
      .select('*')
      .eq('account_id', accountId);
    
    if (locationError) {
      console.error('❌ Error fetching locations:', locationError);
      return;
    }
    
    if (!locations || locations.length === 0) {
      console.log('❌ No locations found');
      return;
    }
    
    const location = locations[0];
    console.log(`📍 Found location: ${location.name} (ID: ${location.id})`);
    
    // Get the prompt page for this location
    const { data: promptPages, error: promptPageError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('business_location_id', location.id);
    
    if (promptPageError) {
      console.error('❌ Error fetching prompt pages:', promptPageError);
      return;
    }
    
    if (!promptPages || promptPages.length === 0) {
      console.log('❌ No prompt pages found for this location');
      return;
    }
    
    const promptPage = promptPages[0];
    console.log(`📄 Found prompt page: ${promptPage.slug} (ID: ${promptPage.id})`);
    
    // Update the location with the prompt page slug
    const { error: updateError } = await supabase
      .from('business_locations')
      .update({ 
        prompt_page_slug: promptPage.slug,
        prompt_page_id: promptPage.id 
      })
      .eq('id', location.id);
    
    if (updateError) {
      console.error('❌ Error updating location:', updateError);
      return;
    }
    
    console.log('✅ Successfully updated location with prompt page slug!');
    console.log(`📍 Location: ${location.name}`);
    console.log(`🔗 Slug: ${promptPage.slug}`);
    console.log(`🌐 URL: http://localhost:3002/r/${promptPage.slug}`);
    console.log('\n🎉 The share buttons should now appear!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixLocationSlug(); 