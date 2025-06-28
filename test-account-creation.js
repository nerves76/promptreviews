require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAccountCreation() {
  try {
    console.log('Testing account creation...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const testUser = {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com'
    };

    // First, let's check if the accounts table exists and what columns it has
    const { data: tableInfo, error: tableError } = await supabase
      .from('accounts')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Table access error:', tableError);
      return;
    }

    console.log('Table access successful');

    // Try to insert a test account
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
      console.error('Insert error:', error);
    } else {
      console.log('Insert successful:', data);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testAccountCreation(); 