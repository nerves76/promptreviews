#!/usr/bin/env node

/**
 * Payment-Plan Mismatch Detection Script
 * 
 * This script detects users who have:
 * 1. Successful Stripe payments/subscriptions
 * 2. But their account plan is still 'no_plan' or incorrect
 * 
 * Run this regularly to catch webhook failures early
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not set in environment');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set in environment');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in environment');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function detectMismatches() {
  console.log('🔍 Detecting payment-plan mismatches...\n');
  
  try {
    // Get all accounts with missing customer IDs or problematic plans
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, email, plan, stripe_customer_id, subscription_status, created_at')
      .or('stripe_customer_id.is.null,plan.eq.no_plan,subscription_status.is.null');
    
    if (error) {
      console.error('❌ Error fetching accounts:', error);
      return;
    }
    
    console.log(`📊 Found ${accounts.length} accounts with potential issues\n`);
    
    const issues = [];
    
    for (const account of accounts) {
      console.log(`🔍 Checking account: ${account.email}`);
      
      // Check if this user has active Stripe subscriptions
      try {
        const customers = await stripe.customers.list({
          email: account.email,
          limit: 5
        });
        
        for (const customer of customers.data) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
            limit: 5
          });
          
          if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            const lookupKey = subscription.items.data[0]?.price.lookup_key?.toLowerCase() || 'unknown';
            const expectedPlan = lookupKey.split('_')[0];
            
            // Check for mismatch
            if (account.plan !== expectedPlan || !account.stripe_customer_id) {
              issues.push({
                account,
                customer,
                subscription,
                expectedPlan,
                actualPlan: account.plan,
                missingCustomerId: !account.stripe_customer_id,
                issue: account.plan !== expectedPlan ? 'plan_mismatch' : 'missing_customer_id'
              });
              
              console.log(`🚨 ISSUE FOUND:`);
              console.log(`   Email: ${account.email}`);
              console.log(`   Account Plan: ${account.plan}`);
              console.log(`   Expected Plan: ${expectedPlan}`);
              console.log(`   Stripe Customer ID: ${account.stripe_customer_id || 'MISSING'}`);
              console.log(`   Subscription Status: ${subscription.status}`);
              console.log('');
            }
          }
        }
      } catch (stripeError) {
        console.log(`   ⚠️  Stripe API error for ${account.email}:`, stripeError.message);
      }
    }
    
    console.log('\n📋 SUMMARY:');
    console.log(`Total accounts checked: ${accounts.length}`);
    console.log(`Issues found: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES REQUIRING ATTENTION:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.account.email}`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Account Plan: ${issue.actualPlan}`);
        console.log(`   Expected Plan: ${issue.expectedPlan}`);
        console.log(`   Customer ID: ${issue.account.stripe_customer_id || 'MISSING'}`);
        console.log('');
      });
      
      console.log('⚠️  These users have paid but their accounts are not properly updated!');
      console.log('🔧 Run fix-account-plan.js to resolve these issues.');
    } else {
      console.log('✅ No mismatches found! All accounts are properly synchronized.');
    }
    
  } catch (error) {
    console.error('❌ Error during mismatch detection:', error);
  }
}

// Run the detection
detectMismatches().catch(console.error); 