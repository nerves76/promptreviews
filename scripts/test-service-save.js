/**
 * Test Service Save Script
 * 
 * This script tests the save functionality on the new service page.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testServiceSave() {
  console.log('🧪 Testing Service Save Functionality');
  console.log('=====================================');

  try {
    // Get the test service page
    const testSlug = 'test-service-1753831162182-f54f3a4lv';
    
    const { data: page, error: fetchError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('slug', testSlug)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching test page:', fetchError);
      return;
    }

    console.log('📄 Current page data:');
    console.log(`   - Slug: ${page.slug}`);
    console.log(`   - Review type: ${page.review_type}`);
    console.log(`   - Show friendly note: ${page.show_friendly_note}`);
    console.log(`   - Friendly note: "${page.friendly_note}"`);
    console.log(`   - Offer enabled: ${page.offer_enabled}`);
    console.log(`   - Offer title: "${page.offer_title}"`);

    // Test updating the personalized note
    const updatedNote = `Updated personalized note - ${new Date().toISOString()}

This note has been updated to test the save functionality on service pages.

The save should work correctly now! 🎉`;

    console.log('\n📝 Updating personalized note...');
    
    const { data: updatedPage, error: updateError } = await supabase
      .from('prompt_pages')
      .update({
        friendly_note: updatedNote,
        show_friendly_note: true,
        offer_enabled: true,
        offer_title: 'Updated Test Offer',
        offer_body: 'This offer has been updated to test save functionality',
        offer_url: 'https://example.com/updated-offer'
      })
      .eq('slug', testSlug)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating test page:', updateError);
      return;
    }

    console.log('✅ Successfully updated test service page:');
    console.log(`   - Show friendly note: ${updatedPage.show_friendly_note}`);
    console.log(`   - Friendly note: "${updatedPage.friendly_note}"`);
    console.log(`   - Offer enabled: ${updatedPage.offer_enabled}`);
    console.log(`   - Offer title: "${updatedPage.offer_title}"`);
    
    console.log('\n🎉 Service save test completed!');
    console.log(`   Visit: http://localhost:3002/r/${updatedPage.slug}`);
    console.log(`   Edit: http://localhost:3002/dashboard/edit-prompt-page/${updatedPage.slug}`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testServiceSave(); 