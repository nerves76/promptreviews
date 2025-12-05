#!/usr/bin/env node

/**
 * CLI Tool to Test Authentication System
 * Run with: node test-auth-cli.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

async function testSupabaseConnection() {
  logSection('Testing Supabase Connection');
  
  try {
    const { data, error } = await supabase.from('accounts').select('count').limit(1);
    if (error) {
      log(`❌ Supabase connection failed: ${error.message}`, colors.red);
      return false;
    }
    log('✅ Supabase connection successful', colors.green);
    return true;
  } catch (err) {
    log(`❌ Unexpected error: ${err.message}`, colors.red);
    return false;
  }
}

async function getCurrentSession() {
  logSection('Checking Current Session');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      log(`❌ Session check failed: ${error.message}`, colors.red);
      return null;
    }
    
    if (!session) {
      log('⚠️  No active session found', colors.yellow);
      return null;
    }
    
    log('✅ Active session found', colors.green);
    log(`   User ID: ${session.user.id}`, colors.blue);
    log(`   Email: ${session.user.email}`, colors.blue);
    log(`   Expires: ${new Date(session.expires_at * 1000).toLocaleString()}`, colors.blue);
    
    return session;
  } catch (err) {
    log(`❌ Unexpected error: ${err.message}`, colors.red);
    return null;
  }
}

async function checkAccountData(userId) {
  logSection('Checking Account Data');
  
  if (!userId) {
    log('⚠️  No user ID provided, skipping account check', colors.yellow);
    return null;
  }
  
  try {
    // Check account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (accountError) {
      log(`❌ Account fetch failed: ${accountError.message}`, colors.red);
      return null;
    }
    
    if (!account) {
      log('⚠️  No account found for user', colors.yellow);
      return null;
    }
    
    log('✅ Account found', colors.green);
    log(`   Account ID: ${account.id}`, colors.blue);
    log(`   Plan: ${account.plan || 'none'}`, colors.blue);
    log(`   Is Admin: ${account.is_admin ? 'Yes' : 'No'}`, colors.blue);
    log(`   Has Business Name: ${account.business_name ? 'Yes' : 'No'}`, colors.blue);
    
    // Check account_users
    const { data: accountUsers, error: usersError } = await supabase
      .from('account_users')
      .select('*')
      .eq('user_id', userId);
    
    if (!usersError && accountUsers) {
      log(`   Account Memberships: ${accountUsers.length}`, colors.blue);
      accountUsers.forEach(au => {
        log(`     - Account: ${au.account_id.substring(0, 8)}... Role: ${au.role}`, colors.cyan);
      });
    }
    
    return account;
  } catch (err) {
    log(`❌ Unexpected error: ${err.message}`, colors.red);
    return null;
  }
}

async function checkBusinessProfiles(accountId) {
  logSection('Checking Business Profiles');
  
  if (!accountId) {
    log('⚠️  No account ID provided, skipping business check', colors.yellow);
    return [];
  }
  
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, created_at')
      .eq('account_id', accountId);
    
    if (error) {
      log(`❌ Business fetch failed: ${error.message}`, colors.red);
      return [];
    }
    
    if (!businesses || businesses.length === 0) {
      log('⚠️  No businesses found for account', colors.yellow);
      return [];
    }
    
    log(`✅ Found ${businesses.length} business(es)`, colors.green);
    businesses.forEach(business => {
      log(`   - ${business.name} (${business.id.substring(0, 8)}...)`, colors.blue);
    });
    
    return businesses;
  } catch (err) {
    log(`❌ Unexpected error: ${err.message}`, colors.red);
    return [];
  }
}

async function detectCommonIssues(session, account, businesses) {
  logSection('Detecting Common Issues');
  
  const issues = [];
  const warnings = [];
  
  // Check for session but no account
  if (session && !account) {
    issues.push('User has session but no account record');
  }
  
  // Check for account but no businesses
  if (account && businesses.length === 0) {
    warnings.push('Account exists but has no businesses');
  }
  
  // Check for expired trial
  if (account?.trial_end) {
    const trialEnd = new Date(account.trial_end);
    if (trialEnd < new Date()) {
      warnings.push('Trial period has expired');
    }
  }
  
  // Check for no plan
  if (account && (!account.plan || account.plan === 'no_plan' || account.plan === 'NULL')) {
    warnings.push('Account has no active plan');
  }
  
  // Check for deleted account
  if (account?.deleted_at) {
    issues.push('Account is marked as deleted but user can still log in');
  }
  
  // Display results
  if (issues.length === 0 && warnings.length === 0) {
    log('✅ No issues detected', colors.green);
  } else {
    if (issues.length > 0) {
      log('\n❌ Critical Issues:', colors.red);
      issues.forEach(issue => log(`   • ${issue}`, colors.red));
    }
    
    if (warnings.length > 0) {
      log('\n⚠️  Warnings:', colors.yellow);
      warnings.forEach(warning => log(`   • ${warning}`, colors.yellow));
    }
  }
  
  return { issues, warnings };
}

async function runFullDiagnostics() {
  console.clear();
  log('🔍 Authentication System Diagnostics', colors.bright + colors.cyan);
  log('=' .repeat(60));
  
  // Test connection
  const connected = await testSupabaseConnection();
  if (!connected) {
    log('\n❌ Cannot proceed without Supabase connection', colors.red);
    process.exit(1);
  }
  
  // Get session
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  
  // Get account data
  const account = userId ? await checkAccountData(userId) : null;
  
  // Get business profiles
  const businesses = account ? await checkBusinessProfiles(account.id) : [];
  
  // Detect issues
  const { issues, warnings } = await detectCommonIssues(session, account, businesses);
  
  // Summary
  logSection('Summary');
  
  const status = {
    'Supabase Connection': connected ? '✅' : '❌',
    'Active Session': session ? '✅' : '❌',
    'Account Exists': account ? '✅' : '❌',
    'Has Businesses': businesses.length > 0 ? '✅' : '❌',
    'Is Admin': account?.is_admin ? '✅' : '❌',
    'Critical Issues': issues.length === 0 ? '✅' : `❌ (${issues.length})`,
    'Warnings': warnings.length === 0 ? '✅' : `⚠️  (${warnings.length})`
  };
  
  Object.entries(status).forEach(([key, value]) => {
    const color = value.includes('✅') ? colors.green : 
                  value.includes('⚠️') ? colors.yellow : 
                  colors.red;
    log(`${key.padEnd(20)} ${value}`, color);
  });
  
  // Recommendations
  if (issues.length > 0 || warnings.length > 0) {
    logSection('Recommendations');
    
    if (issues.includes('User has session but no account record')) {
      log('• Run account creation/migration script', colors.cyan);
    }
    
    if (warnings.includes('Account exists but has no businesses')) {
      log('• User needs to create a business profile', colors.cyan);
    }
    
    if (warnings.includes('Trial period has expired')) {
      log('• User needs to select a paid plan', colors.cyan);
    }
    
    if (warnings.includes('Account has no active plan')) {
      log('• User needs to select a plan', colors.cyan);
    }
    
    if (issues.includes('Account is marked as deleted but user can still log in')) {
      log('• User needs to go through reactivation flow', colors.cyan);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  log('Diagnostics complete', colors.bright + colors.green);
}

// Run diagnostics
runFullDiagnostics().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, colors.red);
  console.error(err);
  process.exit(1);
});