/**
 * Cleanup Test Data Script
 * 
 * This script removes test data created by the test-signup-quick.js script.
 * It can clean up specific test data or all test data based on patterns.
 * 
 * Created: January 28, 2025
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function cleanupTestData() {
  console.log('🧹 Test Data Cleanup Starting...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // 1. Clean up test businesses
    console.log('1️⃣ Cleaning up test businesses...');
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, account_id')
      .like('name', 'Test Business%');

    if (businessError) {
      throw new Error(`Failed to fetch businesses: ${businessError.message}`);
    }

    if (businesses && businesses.length > 0) {
      const businessIds = businesses.map(b => b.id);
      const { error: deleteBusinessError } = await supabase
        .from('businesses')
        .delete()
        .in('id', businessIds);

      if (deleteBusinessError) {
        throw new Error(`Failed to delete businesses: ${deleteBusinessError.message}`);
      }

      console.log(`✅ Deleted ${businesses.length} test businesses`);
      businesses.forEach(b => console.log(`   - ${b.name} (ID: ${b.id})`));
    } else {
      console.log('ℹ️  No test businesses found');
    }

    // 2. Clean up test accounts
    console.log('\n2️⃣ Cleaning up test accounts...');
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('id, email')
      .like('email', 'test-%@example.com');

    if (accountError) {
      throw new Error(`Failed to fetch accounts: ${accountError.message}`);
    }

    if (accounts && accounts.length > 0) {
      const accountIds = accounts.map(a => a.id);
      const { error: deleteAccountError } = await supabase
        .from('accounts')
        .delete()
        .in('id', accountIds);

      if (deleteAccountError) {
        throw new Error(`Failed to delete accounts: ${deleteAccountError.message}`);
      }

      console.log(`✅ Deleted ${accounts.length} test accounts`);
      accounts.forEach(a => console.log(`   - ${a.email} (ID: ${a.id})`));
    } else {
      console.log('ℹ️  No test accounts found');
    }

    // 3. Clean up test users (Supabase Auth)
    console.log('\n3️⃣ Cleaning up test users from Supabase Auth...');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      throw new Error(`Failed to fetch users: ${userError.message}`);
    }

    const testUsers = users.users.filter(user => 
      user.email && user.email.match(/^test-\d+@example\.com$/)
    );

    if (testUsers.length > 0) {
      for (const user of testUsers) {
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteUserError) {
          console.warn(`⚠️  Failed to delete user ${user.email}: ${deleteUserError.message}`);
        } else {
          console.log(`✅ Deleted user: ${user.email} (ID: ${user.id})`);
        }
      }
      console.log(`✅ Deleted ${testUsers.length} test users from Supabase Auth`);
    } else {
      console.log('ℹ️  No test users found in Supabase Auth');
    }

    // 4. Clean up any orphaned account_users entries
    console.log('\n4️⃣ Cleaning up orphaned account_users entries...');
    const { data: accountUsers, error: accountUsersError } = await supabase
      .from('account_users')
      .select('id, user_id, account_id')
      .like('user_id', '00000000-0000-0000-0000-000000000000'); // This won't match real UUIDs, but shows the pattern

    if (accountUsersError) {
      console.warn(`⚠️  Failed to check account_users: ${accountUsersError.message}`);
    } else if (accountUsers && accountUsers.length > 0) {
      const accountUserIds = accountUsers.map(au => au.id);
      const { error: deleteAccountUsersError } = await supabase
        .from('account_users')
        .delete()
        .in('id', accountUserIds);

      if (deleteAccountUsersError) {
        console.warn(`⚠️  Failed to delete account_users: ${deleteAccountUsersError.message}`);
      } else {
        console.log(`✅ Deleted ${accountUsers.length} orphaned account_users entries`);
      }
    } else {
      console.log('ℹ️  No orphaned account_users entries found');
    }

    console.log('\n🎉 Test data cleanup completed successfully!');
    console.log('\n📋 Cleanup Summary:');
    console.log(`   - Businesses deleted: ${businesses?.length || 0}`);
    console.log(`   - Accounts deleted: ${accounts?.length || 0}`);
    console.log(`   - Users deleted: ${testUsers.length}`);
    console.log(`   - Account users cleaned: ${accountUsers?.length || 0}`);

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Function to clean up specific test data by email
async function cleanupSpecificTestData(email) {
  console.log(`🧹 Cleaning up specific test data for: ${email}\n`);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // Get user by email using the correct admin API
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`);
    }
    
    const targetUser = user.users.find(u => u.email === email);
    
    if (!targetUser) {
      console.log(`❌ No user found with email: ${email}`);
      return;
    }
    
    const userId = targetUser.id;
    console.log(`✅ Found user: ${userId}`);
    
    // Delete business first
    const { error: businessError } = await supabase
      .from('businesses')
      .delete()
      .eq('account_id', userId);
    
    if (businessError) {
      console.log(`⚠️  Business cleanup error: ${businessError.message}`);
    } else {
      console.log('✅ Business deleted');
    }
    
    // Delete account_user
    const { error: accountUserError } = await supabase
      .from('account_users')
      .delete()
      .eq('user_id', userId);
    
    if (accountUserError) {
      console.log(`⚠️  Account user cleanup error: ${accountUserError.message}`);
    } else {
      console.log('✅ Account user deleted');
    }
    
    // Delete account
    const { error: accountError } = await supabase
      .from('accounts')
      .delete()
      .eq('id', userId);
    
    if (accountError) {
      console.log(`⚠️  Account cleanup error: ${accountError.message}`);
    } else {
      console.log('✅ Account deleted');
    }
    
    // Delete user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.log(`⚠️  Auth user cleanup error: ${authError.message}`);
    } else {
      console.log('✅ Auth user deleted');
    }
    
    console.log('\n🎉 Specific test data cleanup completed!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const email = args[0];

if (email) {
  cleanupSpecificTestData(email);
} else {
  cleanupTestData();
} 