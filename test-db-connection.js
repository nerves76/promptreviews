require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Test 1: Check if we can access the accounts table
    const { data: tableInfo, error: tableError } = await supabase
      .from('accounts')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Table access error:', tableError);
      return;
    }

    console.log('✅ Table access successful');
    console.log('Sample data:', tableInfo);

    // Test 2: Try to insert a test account
    const testUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com'
    };

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        id: testUser.id,
        user_id: testUser.id,
        email: testUser.email,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_free_account: false,
        custom_prompt_page_count: 0,
        contact_count: 0,
        first_name: '',
        last_name: '',
        plan: 'NULL',
        has_had_paid_plan: false,
        review_notifications_enabled: true
      })
      .select();

    if (error) {
      console.error('❌ Insert error:', error);
    } else {
      console.log('✅ Insert successful:', data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabase(); 