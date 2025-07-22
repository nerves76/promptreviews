/**
 * Script to clean up demo Google Business Profile data
 * Run this to remove any demo locations and ensure only real data remains
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function cleanupDemoData() {
  console.log('🧹 Starting demo data cleanup...\n');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Remove demo locations (those with location_id containing 'demo')
    console.log('🔍 Searching for demo locations...');
    
    const { data: demoLocations, error: searchError } = await supabase
      .from('google_business_locations')
      .select('*')
      .or('location_id.ilike.%demo%,location_name.ilike.%demo%,location_name.ilike.locations/%');

    if (searchError) {
      console.error('❌ Error searching for demo locations:', searchError);
      return;
    }

    console.log(`🔍 Found ${demoLocations?.length || 0} demo/invalid locations to clean up`);
    
    if (demoLocations && demoLocations.length > 0) {
      // Delete demo locations
      const { error: deleteError } = await supabase
        .from('google_business_locations')
        .delete()
        .or('location_id.ilike.%demo%,location_name.ilike.%demo%,location_name.ilike.locations/%');

      if (deleteError) {
        console.error('❌ Error deleting demo locations:', deleteError);
        return;
      }

      console.log(`✅ Successfully removed ${demoLocations.length} demo/invalid locations`);
      demoLocations.forEach(location => {
        console.log(`   - Removed: ${location.location_name || location.location_id}`);
      });
    } else {
      console.log('✅ No demo/invalid locations found to clean up');
    }

    console.log('\n🎯 Demo data cleanup complete!');
    console.log('💡 Your Google Business Profile integration will now use real data only.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run cleanup
cleanupDemoData(); 