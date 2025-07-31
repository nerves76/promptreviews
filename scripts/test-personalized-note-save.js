/**
 * Test Personalized Note Save Script
 * 
 * This script tests if the personalized note is being saved correctly.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPersonalizedNoteSave() {
  console.log('📝 Testing Personalized Note Save');
  console.log('================================');

  try {
    // Get the latest service prompt page for testing
    const { data: pages } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('account_id', '48992937-3386-4079-84cd-08dafe466cd7')
      .eq('review_type', 'service')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!pages || pages.length === 0) {
      console.log('❌ No service prompt pages found for testing');
      return;
    }
    
    const testPage = pages[0];
    console.log(`Testing with page: ${testPage.slug}`);
    console.log(`Current friendly_note: "${testPage.friendly_note}"`);
    console.log(`Current show_friendly_note: ${testPage.show_friendly_note}`);
    
    // Test updating the personalized note
    const testNote = `Hi there! 👋

This is a test personalized note to verify the save functionality is working correctly.

Thanks for testing this feature! 🙏`;

    const { data: updatedPage, error } = await supabase
      .from('prompt_pages')
      .update({
        friendly_note: testNote,
        show_friendly_note: true
      })
      .eq('id', testPage.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating prompt page:', error);
      return;
    }

    console.log('✅ Successfully updated prompt page:');
    console.log(`   - Slug: ${updatedPage.slug}`);
    console.log(`   - Show friendly note: ${updatedPage.show_friendly_note}`);
    console.log(`   - Friendly note: "${updatedPage.friendly_note}"`);
    
    console.log('\n🎉 Personalized note save test completed!');
    console.log(`   Visit: http://localhost:3002/r/${updatedPage.slug}`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testPersonalizedNoteSave(); 