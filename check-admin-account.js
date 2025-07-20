require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Environment check:');
console.log('  Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('  Service Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase configuration');
  console.log('Make sure .env.local contains:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function showAllAccounts() {
  console.log('🔍 Showing all accounts and admin records...\n');
  
  try {
    // Show all accounts
    const { data: allAccounts, error: allAccountsError } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allAccountsError) {
      console.error('❌ Error fetching all accounts:', allAccountsError.message);
    } else {
      console.log('📋 All Accounts (last 10):');
      if (allAccounts && allAccounts.length > 0) {
        allAccounts.forEach((account, index) => {
          console.log(`  ${index + 1}. ${account.email} (Plan: ${account.plan}, Admin: ${account.is_admin}, ID: ${account.id})`);
        });
      } else {
        console.log('  No accounts found');
      }
    }

    // Show all admin records
    const { data: allAdmins, error: allAdminsError } = await supabase
      .from('admins')
      .select('*');

    console.log('\n👑 All Admin Records:');
    if (allAdminsError) {
      console.error('❌ Error fetching admin records:', allAdminsError.message);
    } else if (allAdmins && allAdmins.length > 0) {
      allAdmins.forEach((admin, index) => {
        console.log(`  ${index + 1}. Account ID: ${admin.account_id}, Created: ${admin.created_at}`);
      });
    } else {
      console.log('  No admin records found');
    }

    // Show all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    console.log('\n👤 Auth Users:');
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
    } else if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (ID: ${user.id}, Confirmed: ${!!user.email_confirmed_at})`);
      });
    } else {
      console.log('  No users found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function checkAdminAccount() {
  console.log('🔍 Checking admin account for nerves76@gmail.com...\n');
  
  try {
    // First, let's see all accounts with this email
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', 'nerves76@gmail.com');

    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError.message);
      return;
    }

    console.log('📊 Found', accounts.length, 'account(s) with email nerves76@gmail.com:');
    
    if (!accounts || accounts.length === 0) {
      console.log('❌ No accounts found for nerves76@gmail.com');
      
      // Let's also check if there are any admin records
      const { data: admins, error: adminError } = await supabase
        .from('admins')
        .select('*');
      
      console.log('\n🔍 Checking admin records:');
      if (admins && admins.length > 0) {
        console.log('Found', admins.length, 'admin record(s)');
        admins.forEach((admin, index) => {
          console.log(`  ${index + 1}. Admin ID: ${admin.id}, Account ID: ${admin.account_id}`);
        });
      } else {
        console.log('No admin records found');
      }
      
      return;
    }

    // Show all accounts
    accounts.forEach((account, index) => {
      console.log(`\n📋 Account ${index + 1}:`);
      console.log('  Email:', account.email);
      console.log('  Plan:', account.plan);
      console.log('  Is Admin:', account.is_admin);
      console.log('  Trial End:', account.trial_end);
      console.log('  Account ID:', account.id);
      console.log('  User ID:', account.user_id);
    });

    // Use the first account for business check
    const primaryAccount = accounts[0];

    // Check businesses
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', primaryAccount.id);

    console.log('\n🏢 Businesses for primary account:');
    if (businesses && businesses.length > 0) {
      businesses.forEach((business, index) => {
        console.log(`  ${index + 1}. ${business.name} (ID: ${business.id})`);
      });
    } else {
      console.log('  No businesses found');
    }

    // Analyze the issue
    console.log('\n🔍 Analysis:');
    if (primaryAccount.plan && primaryAccount.plan !== 'no_plan' && primaryAccount.plan !== 'NULL') {
      console.log('  ❌ ISSUE FOUND: Account has plan assigned:', primaryAccount.plan);
      console.log('  This prevents the plan selection modal from showing after business creation.');
      console.log('\n💡 To experience the normal user flow:');
      console.log('  1. Reset plan to "no_plan"');
      console.log('  2. Keep admin privileges');
      console.log('  3. Create a new business to trigger plan selection');
      
    } else {
      console.log('  ✅ Plan is set to:', primaryAccount.plan);
      console.log('  This should trigger plan selection after business creation.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function fixAdminPlan() {
  console.log('🔧 Fixing admin account plan...\n');
  
  try {
    const { data, error } = await supabase
      .from('accounts')
      .update({ 
        plan: 'no_plan'
      })
      .eq('email', 'nerves76@gmail.com')
      .select();

    if (error) {
      console.error('❌ Error updating account:', error.message);
      return;
    }

    console.log('✅ Account plan reset to "no_plan"');
    console.log('✅ Admin privileges maintained');
    console.log('\n🎯 Next steps:');
    console.log('  1. Create a new business');
    console.log('  2. You should now see the plan selection modal');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'fix') {
  fixAdminPlan();
} else if (command === 'all') {
  showAllAccounts();
} else {
  checkAdminAccount();
  console.log('\n💡 Commands available:');
  console.log('   node check-admin-account.js all    # Show all accounts and users');
  console.log('   node check-admin-account.js fix    # Fix your account plan');
} 