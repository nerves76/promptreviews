#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testBusinessCreation() {
  console.log('🧪 Testing business creation flow...');
  
  try {
    // Get the test user we created earlier
    const testUserId = '8cf99d74-a8e2-4fac-a360-4cc05c8e2f4f';
    console.log('🔍 Test user ID:', testUserId);
    
    // Check what account ID the user has
    const { data: accountUsers, error: accountUserError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('user_id', testUserId);
    
    if (accountUserError) {
      console.error('❌ Error fetching account users:', accountUserError);
      return;
    }
    
    console.log('📊 Account users found:', accountUsers);
    
    // Check what businesses exist for this user
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, account_id')
      .eq('account_id', testUserId);
    
    if (businessError) {
      console.error('❌ Error fetching businesses:', businessError);
      return;
    }
    
    console.log('🏢 Businesses found:', businesses);
    
    // Simulate creating a business
    console.log('🔄 Creating test business...');
    const { data: newBusiness, error: createError } = await supabase
      .from('businesses')
      .insert({
        name: 'Test Business',
        account_id: testUserId,
        business_email: 'test@example.com',
        address_city: 'Test City',
        address_state: 'TS',
        address_zip: '12345',
        address_country: 'United States'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating business:', createError);
      return;
    }
    
    console.log('✅ Business created:', newBusiness);
    
    // Now check if the business is found when querying by account_id
    const { data: foundBusinesses, error: findError } = await supabase
      .from('businesses')
      .select('id, name, account_id')
      .eq('account_id', testUserId);
    
    if (findError) {
      console.error('❌ Error finding businesses:', findError);
      return;
    }
    
    console.log('🔍 Businesses found after creation:', foundBusinesses);
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBusinessCreation(); 