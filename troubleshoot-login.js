/**
 * Login Troubleshooting Script for PromptReviews
 * 
 * This script helps diagnose and fix common login issues:
 * 1. Force signin API errors (deprecated getUserByEmail)
 * 2. Missing account/account_users records
 * 3. Authentication state issues
 * 4. Database connection problems
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

// Create clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkDatabaseConnection() {
  console.log('\n🔍 Checking database connection...');
  
  try {
    const { data, error } = await supabase.from('accounts').select('count').limit(1);
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

async function listAllUsers() {
  console.log('\n👥 Listing all users in auth.users...');
  
  try {
    // Use the admin API to list users
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch users:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    const users = data.users || [];
    
    console.log(`✅ Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.id}) - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    });
    
    return users;
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    return [];
  }
}

async function checkAccountsTable() {
  console.log('\n🏢 Checking accounts table...');
  
  try {
    const { data, error } = await supabaseAdmin.from('accounts').select('*');
    if (error) {
      console.error('❌ Error querying accounts:', error.message);
      return [];
    }
    
    console.log(`✅ Found ${data.length} accounts:`);
    data.forEach((account, index) => {
      console.log(`   ${index + 1}. ID: ${account.id}, Email: ${account.email || 'N/A'}`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error checking accounts:', error.message);
    return [];
  }
}

async function checkAccountUsersTable() {
  console.log('\n👤 Checking account_users table...');
  
  try {
    const { data, error } = await supabaseAdmin.from('account_users').select('*');
    if (error) {
      console.error('❌ Error querying account_users:', error.message);
      return [];
    }
    
    console.log(`✅ Found ${data.length} account_user relationships:`);
    data.forEach((record, index) => {
      console.log(`   ${index + 1}. User: ${record.user_id} -> Account: ${record.account_id} (${record.role})`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error checking account_users:', error.message);
    return [];
  }
}

async function checkBusinessesTable() {
  console.log('\n🏪 Checking businesses table...');
  
  try {
    const { data, error } = await supabaseAdmin.from('businesses').select('*');
    if (error) {
      console.error('❌ Error querying businesses:', error.message);
      return [];
    }
    
    console.log(`✅ Found ${data.length} businesses:`);
    data.forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.name} (Account: ${business.account_id})`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error checking businesses:', error.message);
    return [];
  }
}

async function findOrphanedUsers(users, accounts, accountUsers) {
  console.log('\n🔍 Finding orphaned users...');
  
  const orphanedUsers = [];
  
  for (const user of users) {
    // Check if user has an account record
    const hasAccount = accounts.some(account => account.id === user.id);
    
    // Check if user has an account_user record
    const hasAccountUser = accountUsers.some(au => au.user_id === user.id);
    
    if (!hasAccount || !hasAccountUser) {
      orphanedUsers.push({
        user,
        missingAccount: !hasAccount,
        missingAccountUser: !hasAccountUser
      });
    }
  }
  
  if (orphanedUsers.length === 0) {
    console.log('✅ No orphaned users found');
  } else {
    console.log(`⚠️  Found ${orphanedUsers.length} orphaned users:`);
    orphanedUsers.forEach((orphan, index) => {
      console.log(`   ${index + 1}. ${orphan.user.email} (${orphan.user.id})`);
      if (orphan.missingAccount) console.log('      ❌ Missing account record');
      if (orphan.missingAccountUser) console.log('      ❌ Missing account_user record');
    });
  }
  
  return orphanedUsers;
}

async function repairUser(email) {
  console.log(`\n🔧 Repairing user: ${email}`);
  
  try {
    // 1. Get user by email
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to find user:', response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    const users = data.users || [];
    
    if (users.length === 0) {
      console.error('❌ User not found');
      return false;
    }
    
    const user = users[0];
    console.log(`✅ Found user: ${user.email} (${user.id})`);
    
    // 2. Confirm user if not already confirmed
    if (!user.email_confirmed_at) {
      console.log('📧 Confirming user email...');
      const confirmResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_confirm: true
        })
      });
      
      if (!confirmResponse.ok) {
        console.error('❌ Failed to confirm user:', confirmResponse.status, confirmResponse.statusText);
        return false;
      }
      console.log('✅ User email confirmed');
    } else {
      console.log('✅ User email already confirmed');
    }
    
    // 3. Create account record if missing
    const { data: existingAccount, error: accountCheckError } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (!existingAccount) {
      console.log('🏢 Creating account record...');
      const { error: accountError } = await supabaseAdmin
        .from('accounts')
        .insert({
          id: user.id,
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          is_free_account: false,
          custom_prompt_page_count: 0,
          contact_count: 0
        });
      
      if (accountError) {
        console.error('❌ Failed to create account:', accountError.message);
        return false;
      }
      console.log('✅ Account record created');
    } else {
      console.log('✅ Account record already exists');
    }
    
    // 4. Create account_user record if missing
    const { data: existingAccountUser, error: accountUserCheckError } = await supabaseAdmin
      .from('account_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('account_id', user.id)
      .single();
    
    if (!existingAccountUser) {
      console.log('👤 Creating account_user record...');
      const { error: accountUserError } = await supabaseAdmin
        .from('account_users')
        .insert({
          user_id: user.id,
          account_id: user.id,
          role: 'owner'
        });
      
      if (accountUserError) {
        console.error('❌ Failed to create account_user:', accountUserError.message);
        return false;
      }
      console.log('✅ Account_user record created');
    } else {
      console.log('✅ Account_user record already exists');
    }
    
    console.log('✅ User repair completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error repairing user:', error.message);
    return false;
  }
}

async function testForceSignin(email, password) {
  console.log(`\n🧪 Testing force signin for: ${email}`);
  
  try {
    const response = await fetch('http://localhost:3001/api/force-signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Force signin successful');
      return true;
    } else {
      console.error('❌ Force signin failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Force signin error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 PromptReviews Login Troubleshooting Script');
  console.log('==============================================');
  
  // Check database connection
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Get all data
  const users = await listAllUsers();
  const accounts = await checkAccountsTable();
  const accountUsers = await checkAccountUsersTable();
  const businesses = await checkBusinessesTable();
  
  // Find orphaned users
  const orphanedUsers = await findOrphanedUsers(users, accounts, accountUsers);
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Users: ${users.length}`);
  console.log(`   Accounts: ${accounts.length}`);
  console.log(`   Account Users: ${accountUsers.length}`);
  console.log(`   Businesses: ${businesses.length}`);
  console.log(`   Orphaned Users: ${orphanedUsers.length}`);
  
  // Interactive repair
  if (orphanedUsers.length > 0) {
    console.log('\n🔧 Would you like to repair orphaned users?');
    console.log('   Enter an email address to repair, or "all" to repair all, or "skip" to skip:');
    
    // For now, just show the option - in a real script you'd use readline
    console.log('   Example: node troubleshoot-login.js repair user@example.com');
    console.log('   Example: node troubleshoot-login.js repair all');
  }
  
  console.log('\n✅ Troubleshooting complete!');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  const command = args[0];
  
  if (command === 'repair' && args[1]) {
    const email = args[1];
    if (email === 'all') {
      console.log('🔧 Repairing all orphaned users...');
      // This would need to be implemented with the orphaned users list
    } else {
      repairUser(email).then(success => {
        if (success) {
          console.log('✅ Repair completed successfully');
        } else {
          console.log('❌ Repair failed');
          process.exit(1);
        }
      });
    }
  } else {
    console.log('Usage: node troubleshoot-login.js [repair <email>|repair all]');
    process.exit(1);
  }
} else {
  main();
} 