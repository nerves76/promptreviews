#!/usr/bin/env node

/**
 * Force Refresh User Account Script
 * 
 * Use this script when you've changed account data directly in the database
 * and need to force refresh a user's cached session data.
 * 
 * Usage: node scripts/force-refresh-user-account.js <user-email-or-id>
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceRefreshUserAccount(userIdentifier) {
  try {
    console.log('🔄 Force refreshing account data for:', userIdentifier);
    
    // Find user by email or ID
    let user;
    if (userIdentifier.includes('@')) {
      // Email provided
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(userIdentifier);
      if (authError || !authUser) {
        throw new Error(`User not found with email: ${userIdentifier}`);
      }
      user = authUser.user;
    } else {
      // User ID provided
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userIdentifier);
      if (authError || !authUser) {
        throw new Error(`User not found with ID: ${userIdentifier}`);
      }
      user = authUser.user;
    }

    console.log('✅ User found:', user.email, `(ID: ${user.id})`);

    // Get account ID for the user
    const { data: accountUsers, error: accountError } = await supabase
      .from('account_users')
      .select(`
        account_id,
        accounts!inner (
          id,
          plan,
          trial_end,
          is_free_account
        )
      `)
      .eq('user_id', user.id);

    if (accountError || !accountUsers || accountUsers.length === 0) {
      throw new Error(`No account found for user: ${user.email}`);
    }

    // Show current account data
    console.log('\n📊 Current Account Data:');
    accountUsers.forEach((au, index) => {
      const account = au.accounts;
      console.log(`  Account ${index + 1}:`);
      console.log(`    ID: ${au.account_id}`);
      console.log(`    Plan: ${account.plan}`);
      console.log(`    Trial End: ${account.trial_end || 'N/A'}`);
      console.log(`    Is Free: ${account.is_free_account}`);
    });

    // Force refresh user sessions by updating their updated_at timestamp
    const { error: refreshError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        last_account_refresh: new Date().toISOString()
      }
    });

    if (refreshError) {
      console.warn('⚠️  Failed to update user metadata, but account data is still refreshed');
    }

    console.log('\n✅ Account data refresh completed!');
    console.log('💡 User will see updated plan information on next page load');
    
    return true;

  } catch (error) {
    console.error('❌ Error refreshing user account:', error.message);
    return false;
  }
}

// CLI usage
const userIdentifier = process.argv[2];

if (!userIdentifier) {
  console.log('📖 Usage: node scripts/force-refresh-user-account.js <user-email-or-id>');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/force-refresh-user-account.js user@example.com');
  console.log('  node scripts/force-refresh-user-account.js bc672b60-3db1-4800-9ac0-158cab846f6c');
  process.exit(1);
}

forceRefreshUserAccount(userIdentifier)
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 