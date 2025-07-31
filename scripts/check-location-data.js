/**
 * Script to check location data and prompt page slugs
 * Usage: node scripts/check-location-data.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLocationData() {
  try {
    console.log('🔍 Checking all location data...');
    
    // Get all locations with their prompt page data
    const { data: locations, error: fetchError } = await supabase
      .from('business_locations')
      .select(`
        *,
        prompt_pages!business_location_id(*)
      `);
    
    if (fetchError) {
      console.error('❌ Error fetching locations:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${locations.length} locations:`);
    
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
    
    // Check for locations with prompt_page_slug but no associated prompt page
    const locationsWithSlugButNoPage = locations.filter(loc => 
      loc.prompt_page_slug && (!loc.prompt_pages || loc.prompt_pages.length === 0)
    );
    console.log(`\n⚠️  Locations with slug but no prompt page: ${locationsWithSlugButNoPage.length}`);
    
    if (locationsWithSlugButNoPage.length > 0) {
      locationsWithSlugButNoPage.forEach(location => {
        console.log(`   - ${location.name} (slug: ${location.prompt_page_slug})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkLocationData(); 