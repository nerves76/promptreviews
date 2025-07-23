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

// Create service role client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function forceRefreshUserAccount(userIdentifier) {
  try {
    console.log('🔄 Force refreshing account data for:', userIdentifier);
    
    // Find user in account_users table by joining with auth info
    let accountUsers;
    
    if (userIdentifier.includes('@')) {
      // Email provided - need to find user ID first
      console.log('🔍 Looking up user by email...');
      
      // Query account_users and join to get user email from auth
      const { data: results, error: queryError } = await supabase.rpc('get_user_by_email', { 
        user_email: userIdentifier 
      });
      
      if (queryError) {
        // Fallback to direct query if RPC doesn't exist
        console.log('🔍 Trying direct account lookup...');
        const { data: allAccountUsers, error: allError } = await supabase
          .from('account_users')
          .select(`
            *,
            accounts!inner (
              id,
              plan,
              trial_end,
              is_free_account,
              email
            )
          `);
          
        if (allError) {
          throw new Error(`Query failed: ${allError.message}`);
        }
        
        // Find by email in account
        accountUsers = allAccountUsers.filter(au => 
          au.accounts.email && au.accounts.email.toLowerCase() === userIdentifier.toLowerCase()
        );
        
        if (accountUsers.length === 0) {
          throw new Error(`No account found for email: ${userIdentifier}`);
        }
      } else {
        accountUsers = results;
      }
    } else {
      // User ID provided
      const { data: results, error: accountError } = await supabase
        .from('account_users')
        .select(`
          *,
          accounts!inner (
            id,
            plan,
            trial_end,
            is_free_account,
            email
          )
        `)
        .eq('user_id', userIdentifier);

      if (accountError || !results || results.length === 0) {
        throw new Error(`No account found for user ID: ${userIdentifier}`);
      }
      
      accountUsers = results;
    }

    console.log('✅ User found with', accountUsers.length, 'account(s)');

    // Show current account data
    console.log('\n📊 Current Account Data:');
    accountUsers.forEach((au, index) => {
      const account = au.accounts;
      console.log(`  Account ${index + 1}:`);
      console.log(`    ID: ${au.account_id}`);
      console.log(`    User ID: ${au.user_id}`);
      console.log(`    Email: ${account.email || 'N/A'}`);
      console.log(`    Plan: ${account.plan}`);
      console.log(`    Trial End: ${account.trial_end || 'N/A'}`);
      console.log(`    Is Free: ${account.is_free_account}`);
    });

    // Force refresh by updating account timestamps
    console.log('\n🔄 Forcing cache refresh...');
    
    for (const au of accountUsers) {
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', au.account_id);

      if (updateError) {
        console.warn(`⚠️  Failed to update account ${au.account_id}:`, updateError.message);
      } else {
        console.log(`✅ Updated account ${au.account_id} timestamp`);
      }
    }

    console.log('\n✅ Account data refresh completed!');
    console.log('💡 User will see updated plan information on next page load');
    console.log('💡 Or they can refresh their browser to see changes immediately');
    
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