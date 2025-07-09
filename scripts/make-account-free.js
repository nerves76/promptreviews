/**
 * Make Account Free - Utility Script
 * 
 * This script allows you to mark specific accounts as permanently free,
 * bypassing trial restrictions and Stripe payment requirements while
 * maintaining plan-based feature limits.
 * 
 * Usage: node scripts/make-account-free.js <email> [plan_level]
 * Example: node scripts/make-account-free.js user@example.com grower
 * Example: node scripts/make-account-free.js user@example.com builder
 * Example: node scripts/make-account-free.js user@example.com maven
 * 
 * If no plan_level is provided, defaults to 'grower'
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function makeAccountFree(email, planLevel = 'grower') {
  try {
    // Validate plan level
    const validPlans = ['grower', 'builder', 'maven'];
    if (!validPlans.includes(planLevel)) {
      console.error(`❌ Invalid plan level: ${planLevel}`);
      console.error(`Valid options: ${validPlans.join(', ')}`);
      return;
    }

    console.log(`🔍 Looking for account with email: ${email}`);
    console.log(`🎯 Setting free plan level: ${planLevel}`);
    
    // Find account by email
    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('email', email)
      .single();
    
    if (accountError) {
      console.error('❌ Error finding account:', accountError.message);
      return;
    }
    
    if (!account) {
      console.error('❌ No account found with that email');
      return;
    }
    
    console.log('📋 Current account status:');
    console.log(`  Email: ${account.email}`);
    console.log(`  Plan: ${account.plan}`);
    console.log(`  Trial End: ${account.trial_end}`);
    console.log(`  Is Free: ${account.is_free_account}`);
    console.log(`  Free Plan Level: ${account.free_plan_level || 'not set'}`);
    console.log(`  Has Had Paid Plan: ${account.has_had_paid_plan}`);
    
    // Update account to be permanently free with specific plan level
    const { error: updateError } = await supabaseAdmin
      .from('accounts')
      .update({
        is_free_account: true,
        free_plan_level: planLevel,
        plan: planLevel, // Set actual plan to match free plan level
        trial_end: null, // Remove trial end date
        updated_at: new Date().toISOString()
      })
      .eq('id', account.id);
    
    if (updateError) {
      console.error('❌ Error updating account:', updateError.message);
      return;
    }
    
    console.log('✅ Account successfully marked as free!');
    console.log('🎉 Benefits:');
    console.log('  • No trial expiration');
    console.log('  • No subscription required');
    console.log('  • Bypasses all Stripe payment requirements');
    console.log(`  • ${planLevel} plan features enabled`);
    console.log('  • Plan-based feature limits still apply');
    
    // Show plan-specific limits
    const planLimits = {
      grower: { prompt_pages: 4, contacts: 'unlimited' },
      builder: { prompt_pages: 100, contacts: 100 },
      maven: { prompt_pages: 500, contacts: 500 }
    };
    
    const limits = planLimits[planLevel];
    console.log(`📊 ${planLevel} plan limits:`);
    console.log(`  • Prompt pages: ${limits.prompt_pages}`);
    console.log(`  • Contacts: ${limits.contacts}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email and plan level from command line arguments
const email = process.argv[2];
const planLevel = process.argv[3] || 'grower';

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/make-account-free.js <email> [plan_level]');
  console.log('Plan levels: grower, builder, maven (defaults to grower)');
  process.exit(1);
}

makeAccountFree(email, planLevel); 