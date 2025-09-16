/**
 * Create Test Service Page Script
 * 
 * This script creates a proper test service page to verify the save functionality.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestServicePage() {
  console.log('🔧 Creating Test Service Page');
  console.log('============================');

  try {
    const testServiceData = {
      account_id: '48992937-3386-4079-84cd-08dafe466cd7',
      review_type: 'service',
      service_name: 'Test Service',
      client_name: 'Test Client',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      role: 'Customer',
      friendly_note: 'Hi there! 👋\n\nThis is a test service page to verify the save functionality is working correctly.\n\nThanks for testing! 🙏',
      show_friendly_note: true,
      offer_enabled: true,
      offer_title: 'Special Test Offer',
      offer_body: 'Get 20% off your next service!',
      offer_url: 'https://example.com/offer',
      emoji_sentiment_enabled: false,
      ai_button_enabled: true,
      review_platforms: [],
      status: 'complete',
      slug: `test-service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    console.log('📝 Creating service page with data:', {
      slug: testServiceData.slug,
      service_name: testServiceData.service_name,
      show_friendly_note: testServiceData.show_friendly_note,
      friendly_note: testServiceData.friendly_note.substring(0, 50) + '...'
    });

    const { data: newPage, error } = await supabase
      .from('prompt_pages')
      .insert(testServiceData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating test service page:', error);
      return;
    }

    console.log('✅ Successfully created test service page:');
    console.log(`   - Slug: ${newPage.slug}`);
    console.log(`   - Service name: ${newPage.service_name}`);
    console.log(`   - Show friendly note: ${newPage.show_friendly_note}`);
    console.log(`   - Friendly note: "${newPage.friendly_note}"`);
    
    console.log('\n🎉 Test service page created!');
    console.log(`   Visit: http://localhost:3002/r/${newPage.slug}`);
    console.log(`   Edit: http://localhost:3002/dashboard/edit-prompt-page/${newPage.slug}`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

createTestServicePage(); 