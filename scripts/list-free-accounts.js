/**
 * List Free Accounts - Utility Script
 * 
 * This script lists all free accounts and their plan levels,
 * providing an overview of accounts that bypass payment requirements.
 * 
 * Usage: node scripts/list-free-accounts.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listFreeAccounts() {
  try {
    console.log('🔍 Fetching all free accounts...\n');
    
    // Find all free accounts
    const { data: accounts, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('id, email, plan, free_plan_level, created_at, first_name, last_name, is_free_account')
      .eq('is_free_account', true)
      .order('created_at', { ascending: false });
    
    if (accountError) {
      console.error('❌ Error fetching accounts:', accountError.message);
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('📭 No free accounts found');
      return;
    }
    
    console.log(`📊 Found ${accounts.length} free account(s):\n`);
    
    // Group accounts by plan level
    const accountsByPlan = {
      grower: [],
      builder: [],
      maven: [],
      other: []
    };
    
    accounts.forEach(account => {
      const planLevel = account.free_plan_level || 'other';
      if (accountsByPlan[planLevel]) {
        accountsByPlan[planLevel].push(account);
      } else {
        accountsByPlan.other.push(account);
      }
    });
    
    // Display accounts by plan level
    ['grower', 'builder', 'maven', 'other'].forEach(planLevel => {
      const planAccounts = accountsByPlan[planLevel];
      if (planAccounts.length > 0) {
        console.log(`🔹 ${planLevel.toUpperCase()} FREE ACCOUNTS (${planAccounts.length}):`);
        
        planAccounts.forEach((account, index) => {
          const name = account.first_name || account.last_name 
            ? `${account.first_name || ''} ${account.last_name || ''}`.trim()
            : 'No name';
          const createdDate = new Date(account.created_at).toLocaleDateString();
          
          console.log(`  ${index + 1}. ${account.email}`);
          console.log(`     Name: ${name}`);
          console.log(`     Created: ${createdDate}`);
          console.log(`     Plan: ${account.plan}`);
          console.log(`     Free Plan Level: ${account.free_plan_level || 'not set'}`);
          console.log('');
        });
      }
    });
    
    // Show summary
    console.log('📈 SUMMARY:');
    console.log(`  Total free accounts: ${accounts.length}`);
    console.log(`  Grower level: ${accountsByPlan.grower.length}`);
    console.log(`  Builder level: ${accountsByPlan.builder.length}`);
    console.log(`  Maven level: ${accountsByPlan.maven.length}`);
    console.log(`  Other/unset: ${accountsByPlan.other.length}`);
    
    // Show plan limits reminder
    console.log('\n📊 PLAN LIMITS REMINDER:');
    console.log('  Grower: 4 prompt pages, unlimited contacts');
    console.log('  Builder: 100 prompt pages, 100 contacts');
    console.log('  Maven: 500 prompt pages, 500 contacts');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

listFreeAccounts(); 