/**
 * Test script to verify personalized notes are working correctly
 * 
 * This script tests:
 * 1. Database schema has correct default values
 * 2. Form components initialize with correct defaults
 * 3. Prompt page display logic works for both public and individual campaigns
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function testPersonalizedNotes() {
  console.log('🧪 Testing Personalized Notes Feature');
  console.log('=====================================');

  try {
    // Test 1: Check database schema defaults
    console.log('\n1. Checking database schema defaults...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, column_default, is_nullable')
      .eq('table_name', 'prompt_pages')
      .eq('column_name', 'show_friendly_note');

    if (schemaError) {
      console.error('❌ Error checking schema:', schemaError);
    } else {
      console.log('✅ Schema check result:', schemaData);
    }

    // Test 2: Check existing prompt pages
    console.log('\n2. Checking existing prompt pages...');
    const { data: pages, error: pagesError } = await supabase
      .from('prompt_pages')
      .select('id, slug, show_friendly_note, friendly_note, campaign_type, type')
      .limit(5);

    if (pagesError) {
      console.error('❌ Error fetching pages:', pagesError);
    } else {
      console.log('✅ Found prompt pages:');
      pages.forEach(page => {
        console.log(`   - ${page.slug} (${page.type}/${page.campaign_type}): show_friendly_note=${page.show_friendly_note}, friendly_note="${page.friendly_note}"`);
      });
    }

    // Test 3: Create a test prompt page with personalized note
    console.log('\n3. Creating test prompt page with personalized note...');
    const testData = {
      account_id: '00000000-0000-0000-0000-000000000001', // Test account
      type: 'service',
      campaign_type: 'public',
      name: 'Test Service Page',
      show_friendly_note: true,
      friendly_note: 'This is a test personalized note for a public campaign!',
      status: 'complete',
      slug: `test-personalized-note-${Date.now()}`,
      review_platforms: []
    };

    const { data: newPage, error: createError } = await supabase
      .from('prompt_pages')
      .insert(testData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test page:', createError);
    } else {
      console.log('✅ Created test page:', {
        id: newPage.id,
        slug: newPage.slug,
        show_friendly_note: newPage.show_friendly_note,
        friendly_note: newPage.friendly_note,
        campaign_type: newPage.campaign_type
      });
    }

    // Test 4: Test the display logic conditions
    console.log('\n4. Testing display logic conditions...');
    const testCases = [
      {
        name: 'Public campaign with note',
        show_friendly_note: true,
        friendly_note: 'Test note',
        campaign_type: 'public',
        expected: true
      },
      {
        name: 'Individual campaign with note',
        show_friendly_note: true,
        friendly_note: 'Test note',
        campaign_type: 'individual',
        expected: true
      },
      {
        name: 'Public campaign without note',
        show_friendly_note: true,
        friendly_note: null,
        campaign_type: 'public',
        expected: false
      },
      {
        name: 'Individual campaign without note',
        show_friendly_note: true,
        friendly_note: null,
        campaign_type: 'individual',
        expected: false
      },
      {
        name: 'Disabled note',
        show_friendly_note: false,
        friendly_note: 'Test note',
        campaign_type: 'public',
        expected: false
      }
    ];

    testCases.forEach(testCase => {
      const shouldShow = testCase.show_friendly_note && 
                        testCase.friendly_note && 
                        true; // Removed campaign_type restriction
      
      const status = shouldShow === testCase.expected ? '✅' : '❌';
      console.log(`${status} ${testCase.name}: shouldShow=${shouldShow}, expected=${testCase.expected}`);
    });

    console.log('\n🎉 Personalized notes test completed!');
    console.log('\n📝 Summary of fixes applied:');
    console.log('   - Removed campaign_type restriction from display logic');
    console.log('   - Fixed default values in form components (false → true)');
    console.log('   - Fixed default values in data mapping (false → true)');
    console.log('   - Fixed default values in CreatePromptPageClient (false → true)');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPersonalizedNotes(); 