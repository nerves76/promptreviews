const { createClient } = require('@supabase/supabase-js');

// Test script to check current user's account and universal prompt page
async function testCurrentUser() {
  console.log('🔍 Testing Current User Account Status...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  try {
    // Get all users to see what accounts exist
    console.log('1️⃣ Checking all users and accounts...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users.users.length} users:`);
    users.users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.id}) - Created: ${user.created_at}`);
    });

    // Get all accounts
    console.log('\n2️⃣ Checking all accounts...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return;
    }

    console.log(`Found ${accounts.length} accounts:`);
    accounts.forEach((account, index) => {
      console.log(`  ${index + 1}. ID: ${account.id} - Email: ${account.email} - Plan: ${account.plan}`);
    });

    // Get all businesses
    console.log('\n3️⃣ Checking all businesses...');
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (businessesError) {
      console.error('Error fetching businesses:', businessesError);
      return;
    }

    console.log(`Found ${businesses.length} businesses:`);
    businesses.forEach((business, index) => {
      console.log(`  ${index + 1}. ID: ${business.id} - Name: ${business.business_name} - Account: ${business.account_id}`);
    });

    // Get all universal prompt pages
    console.log('\n4️⃣ Checking all universal prompt pages...');
    const { data: universalPages, error: universalError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('is_universal', true)
      .order('created_at', { ascending: false });

    if (universalError) {
      console.error('Error fetching universal pages:', universalError);
      return;
    }

    console.log(`Found ${universalPages.length} universal prompt pages:`);
    universalPages.forEach((page, index) => {
      console.log(`  ${index + 1}. ID: ${page.id} - Slug: ${page.slug} - Account: ${page.account_id}`);
    });

    // Get all account_users relationships
    console.log('\n5️⃣ Checking account_users relationships...');
    const { data: accountUsers, error: accountUsersError } = await supabase
      .from('account_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (accountUsersError) {
      console.error('Error fetching account_users:', accountUsersError);
      return;
    }

    console.log(`Found ${accountUsers.length} account_users relationships:`);
    accountUsers.forEach((au, index) => {
      console.log(`  ${index + 1}. Account: ${au.account_id} - User: ${au.user_id} - Role: ${au.role}`);
    });

    // Check for orphaned users
    console.log('\n6️⃣ Checking for orphaned users...');
    const orphanedUsers = users.users.filter(user => 
      !accountUsers.some(au => au.user_id === user.id)
    );

    if (orphanedUsers.length > 0) {
      console.log('❌ Found orphaned users:');
      orphanedUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.id})`);
      });
    } else {
      console.log('✅ No orphaned users found');
    }

    // Check for orphaned accounts
    const orphanedAccounts = accounts.filter(account => 
      !accountUsers.some(au => au.account_id === account.id)
    );

    if (orphanedAccounts.length > 0) {
      console.log('❌ Found orphaned accounts:');
      orphanedAccounts.forEach(account => {
        console.log(`  - ${account.email} (${account.id})`);
      });
    } else {
      console.log('✅ No orphaned accounts found');
    }

    // Test the getAccountIdForUser function logic
    console.log('\n7️⃣ Testing getAccountIdForUser function logic...');
    if (users.users.length > 0) {
      const testUser = users.users[0];
      console.log(`Testing with user: ${testUser.email} (${testUser.id})`);
      
      // Simulate the getAccountIdForUser function
      const { data: accountUser, error: auError } = await supabase
        .from('account_users')
        .select('account_id')
        .eq('user_id', testUser.id)
        .maybeSingle();

      if (auError) {
        console.error('❌ Error in getAccountIdForUser simulation:', auError);
      } else if (accountUser) {
        console.log(`✅ getAccountIdForUser found account_id: ${accountUser.account_id}`);
        
        // Test fetching universal prompt page with the account_id
        const { data: universalPage, error: upError } = await supabase
          .from('prompt_pages')
          .select('*')
          .eq('account_id', accountUser.account_id)
          .eq('is_universal', true)
          .maybeSingle();

        if (upError) {
          console.error('❌ Error fetching universal prompt page:', upError);
        } else if (universalPage) {
          console.log(`✅ Found universal prompt page: ${universalPage.slug}`);
        } else {
          console.log('❌ No universal prompt page found for this account');
        }
      } else {
        console.log('❌ No account_user record found for this user');
      }
    }

    // Test with frontend client (simulating browser environment)
    console.log('\n8️⃣ Testing with frontend client (simulating browser)...');
    const frontendSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );

    if (users.users.length > 0) {
      const testUser = users.users[0];
      console.log(`Testing frontend client with user: ${testUser.email}`);
      
      // Try to get the current user (this would fail in browser without proper session)
      const { data: { user }, error: userError } = await frontendSupabase.auth.getUser();
      
      if (userError) {
        console.log('❌ Frontend client auth error (expected):', userError.message);
      } else if (user) {
        console.log(`✅ Frontend client found user: ${user.email}`);
        
        // Test the account_user lookup
        const { data: accountUser, error: auError } = await frontendSupabase
          .from('account_users')
          .select('account_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (auError) {
          console.error('❌ Frontend client account_user error:', auError);
        } else if (accountUser) {
          console.log(`✅ Frontend client found account_id: ${accountUser.account_id}`);
        } else {
          console.log('❌ Frontend client: No account_user record found');
        }
      } else {
        console.log('❌ Frontend client: No user found (this is the issue!)');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testCurrentUser(); 