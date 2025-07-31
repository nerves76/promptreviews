/**
 * Test Save Functionality Script
 * 
 * This script tests if the save functionality is working correctly for service pages.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSaveFunctionality() {
  console.log('🧪 Testing Save Functionality');
  console.log('=============================');

  try {
    // Get the latest service prompt page
    const { data: pages } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('account_id', '48992937-3386-4079-84cd-08dafe466cd7')
      .eq('review_type', 'service')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!pages || pages.length === 0) {
      console.log('❌ No service prompt pages found');
      return;
    }
    
    const testPage = pages[0];
    console.log(`Testing with page: ${testPage.slug}`);
    console.log(`Current data:`);
    console.log(`- show_friendly_note: ${testPage.show_friendly_note}`);
    console.log(`- friendly_note: "${testPage.friendly_note}"`);
    console.log(`- offer_enabled: ${testPage.offer_enabled}`);
    console.log(`- offer_title: "${testPage.offer_title}"`);
    
    // Test updating the page with new data
    const testData = {
      show_friendly_note: true,
      friendly_note: `Test personalized note - ${new Date().toISOString()}`,
      offer_enabled: true,
      offer_title: "Special Test Offer",
      offer_body: "This is a test offer body",
      offer_url: "https://example.com",
      emoji_sentiment_enabled: false,
      ai_button_enabled: true,
      review_platforms: []
    };

    console.log('\n📝 Updating page with test data...');
    
    const { data: updatedPage, error } = await supabase
      .from('prompt_pages')
      .update(testData)
      .eq('id', testPage.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating prompt page:', error);
      return;
    }

    console.log('✅ Successfully updated prompt page:');
    console.log(`- show_friendly_note: ${updatedPage.show_friendly_note}`);
    console.log(`- friendly_note: "${updatedPage.friendly_note}"`);
    console.log(`- offer_enabled: ${updatedPage.offer_enabled}`);
    console.log(`- offer_title: "${updatedPage.offer_title}"`);
    
    console.log('\n🎉 Save functionality test completed!');
    console.log(`Visit: http://localhost:3002/r/${updatedPage.slug}`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testSaveFunctionality(); 