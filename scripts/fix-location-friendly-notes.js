// -----------------------------------------------------------------------------
// Fix Location Prompt Pages Friendly Notes Script
// This script removes incorrect friendly_note data from location prompt pages
// that was incorrectly set from unique_aspects during creation.
// -----------------------------------------------------------------------------

import { createServiceRoleClient } from '../src/utils/supabaseClient';

async function fixLocationFriendlyNotes() {
  console.log('🔧 Starting location prompt page friendly note cleanup...');
  
  const supabase = createServiceRoleClient();
  
  try {
    // Find all location prompt pages that have friendly_note set
    const { data: locationPages, error: fetchError } = await supabase
      .from('prompt_pages')
      .select('id, slug, friendly_note, business_location_id')
      .not('business_location_id', 'is', null)
      .not('friendly_note', 'is', null)
      .neq('friendly_note', '');
    
    if (fetchError) {
      console.error('❌ Error fetching location prompt pages:', fetchError);
      return;
    }
    
    console.log(`📋 Found ${locationPages.length} location prompt pages with friendly_note data`);
    
    if (locationPages.length === 0) {
      console.log('✅ No location prompt pages need fixing');
      return;
    }
    
    // Update each page to clear the friendly_note
    let updatedCount = 0;
    for (const page of locationPages) {
      console.log(`🔄 Fixing page: ${page.slug} (ID: ${page.id})`);
      console.log(`   Current friendly_note: "${page.friendly_note}"`);
      
      const { error: updateError } = await supabase
        .from('prompt_pages')
        .update({ 
          friendly_note: null,
          show_friendly_note: false 
        })
        .eq('id', page.id);
      
      if (updateError) {
        console.error(`❌ Error updating page ${page.slug}:`, updateError);
      } else {
        updatedCount++;
        console.log(`✅ Fixed page: ${page.slug}`);
      }
    }
    
    console.log(`🎉 Successfully fixed ${updatedCount} location prompt pages`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
fixLocationFriendlyNotes()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 