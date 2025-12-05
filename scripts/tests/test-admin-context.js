/**
 * Test script to verify admin context functionality
 * This script tests the admin status checking without the UI components
 */

const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAdminContext() {
  console.log('🧪 Testing Admin Context Functionality...\n');

  try {
    // 1. Test auth status
    console.log('1. Testing auth status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
      return;
    }
    
    if (!user) {
      console.log('❌ No user found - please sign in first');
      return;
    }
    
    console.log('✅ User found:', user.id, user.email);

    // 2. Test admins table access
    console.log('\n2. Testing admins table access...');
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
      .limit(5);
    
    if (adminsError) {
      console.log('❌ Admins table error:', adminsError.message);
      console.log('   Details:', adminsError.details);
      console.log('   Code:', adminsError.code);
    } else {
      console.log('✅ Admins table accessible');
      console.log('   Found', admins?.length || 0, 'admin records');
    }

    // 3. Test specific user admin check
    console.log('\n3. Testing admin check for current user...');
    const { data: userAdmin, error: userAdminError } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (userAdminError) {
      console.log('❌ User admin check error:', userAdminError.message);
    } else {
      const isAdmin = !!userAdmin;
      console.log('✅ User admin check completed');
      console.log('   Is admin:', isAdmin);
    }

    // 4. Test RLS policies
    console.log('\n4. Testing RLS policies...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('admins')
      .select('count')
      .limit(1);
    
    if (rlsError) {
      console.log('❌ RLS policy error:', rlsError.message);
      console.log('   This might indicate RLS is blocking access');
    } else {
      console.log('✅ RLS policies allow access');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testAdminContext().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 