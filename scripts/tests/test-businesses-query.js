require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBusinessesQuery() {
  try {
    console.log('Testing businesses query...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const testUserId = 'ca6318e5-c45d-445c-b0fa-8c67de5577c3';
    
    // Test 1: Check if we can access the businesses table at all
    console.log('\n1. Testing basic businesses table access...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('businesses')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Table access error:', tableError);
      return;
    }

    console.log('✅ Table access successful');
    console.log('Sample data:', tableInfo?.[0]);

    // Test 2: Check if account_id column exists
    console.log('\n2. Testing account_id column...');
    const { data: accountIdTest, error: accountIdError } = await supabase
      .from('businesses')
      .select('id, account_id')
      .limit(1);

    if (accountIdError) {
      console.error('account_id column error:', accountIdError);
    } else {
      console.log('✅ account_id column exists');
      console.log('Sample with account_id:', accountIdTest?.[0]);
    }

    // Test 3: Try the specific query that's failing
    console.log('\n3. Testing the failing query...');
    const { data: failingQuery, error: failingError } = await supabase
      .from('businesses')
      .select('id')
      .eq('account_id', testUserId);

    if (failingError) {
      console.error('❌ Failing query error:', failingError);
    } else {
      console.log('✅ Failing query successful');
      console.log('Result:', failingQuery);
    }

    // Test 4: Check if the user has an account
    console.log('\n4. Checking if user has an account...');
    const { data: accountTest, error: accountError } = await supabase
      .from('accounts')
      .select('id, user_id')
      .eq('user_id', testUserId);

    if (accountError) {
      console.error('Account query error:', accountError);
    } else {
      console.log('✅ Account query successful');
      console.log('User accounts:', accountTest);
      
      if (accountTest && accountTest.length > 0) {
        const accountId = accountTest[0].id;
        console.log('Account ID:', accountId);
        
        // Test 5: Try querying businesses with the correct account ID
        console.log('\n5. Testing with correct account ID...');
        const { data: correctQuery, error: correctError } = await supabase
          .from('businesses')
          .select('id')
          .eq('account_id', accountId);

        if (correctError) {
          console.error('❌ Correct query error:', correctError);
        } else {
          console.log('✅ Correct query successful');
          console.log('Result:', correctQuery);
        }
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBusinessesQuery(); 