const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBusinessQuery() {
  console.log('🔍 Checking Business Query Issue...\n');

  try {
    // Get chris's user ID
    const userEmail = 'chris@diviner.agency';
    const { data: authData } = await supabase.auth.admin.listUsers();
    const user = authData?.users?.find(u => u.email === userEmail);
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`👤 User: ${user.email}`);
    console.log(`   ID: ${user.id}\n`);

    // Check account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .single();

    if (accountError) {
      console.log('❌ Account error:', accountError);
      return;
    }

    console.log('📊 Account found:');
    console.log(`   ID: ${account.id}`);
    console.log(`   Email: ${account.email}`);
    console.log(`   Plan: ${account.plan}\n`);

    // Query 1: Business using account.id (which equals user.id)
    console.log('🔍 Query 1: Checking business with account_id = account.id (user.id)');
    const { data: business1, error: error1 } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', account.id)
      .single();

    if (error1 && error1.code !== 'PGRST116') {
      console.log('   ❌ Error:', error1.message);
    } else if (!business1) {
      console.log('   ⚠️  No business found with account_id = ' + account.id);
    } else {
      console.log('   ✅ Business found:', business1.name);
    }

    // Query 2: Check all businesses to see what account_id values exist
    console.log('\n🔍 Query 2: Checking all businesses in database');
    const { data: allBusinesses, error: allError } = await supabase
      .from('businesses')
      .select('id, name, account_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.log('   ❌ Error:', allError.message);
    } else if (allBusinesses && allBusinesses.length > 0) {
      console.log(`   Found ${allBusinesses.length} businesses:`);
      allBusinesses.forEach(b => {
        console.log(`   - ${b.name}: account_id = ${b.account_id}`);
        if (b.account_id === user.id) {
          console.log(`     ✅ This matches our user!`);
        }
      });
    } else {
      console.log('   No businesses found');
    }

    // Query 3: Check account_users table
    console.log('\n🔍 Query 3: Checking account_users relationships');
    const { data: accountUsers, error: auError } = await supabase
      .from('account_users')
      .select('*')
      .eq('user_id', user.id);

    if (auError) {
      console.log('   ❌ Error:', auError.message);
    } else if (accountUsers && accountUsers.length > 0) {
      console.log(`   Found ${accountUsers.length} account relationships:`);
      accountUsers.forEach(au => {
        console.log(`   - Account: ${au.account_id}, Role: ${au.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkBusinessQuery();