/**
 * Make Account Free - Utility Script
 * 
 * This script allows you to mark specific accounts as permanently free,
 * bypassing trial restrictions and plan limitations.
 * 
 * Usage: node scripts/make-account-free.js <email>
 * Example: node scripts/make-account-free.js user@example.com
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function makeAccountFree(email) {
  try {
    console.log(`🔍 Looking for account with email: ${email}`);
    
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
    console.log(`  Has Had Paid Plan: ${account.has_had_paid_plan}`);
    
    // Update account to be permanently free
    const { error: updateError } = await supabaseAdmin
      .from('accounts')
      .update({
        is_free_account: true,
        plan: 'grower', // Keep on grower plan but make it free
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
    console.log('  • Unlimited access to all features');
    console.log('  • Bypasses plan restrictions');
    console.log('  • Can continue using the app indefinitely');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/make-account-free.js <email>');
  process.exit(1);
}

makeAccountFree(email); 