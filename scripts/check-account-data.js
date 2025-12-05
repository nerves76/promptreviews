/**
 * Debug script to check account data
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAccountData() {
  try {
    // Check the specific user's account
    const userId = '7f2eaf2f-922a-403e-8e94-b96957717fcf';
    
    console.log('🔍 Checking account data for user:', userId);
    
    // Get account user data
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select(`
        account_id,
        role,
        accounts (
          id,
          first_name,
          last_name,
          business_name,
          plan,
          max_users,
          stripe_customer_id,
          stripe_subscription_id,
          subscription_status,
          has_had_paid_plan
        )
      `)
      .eq('user_id', userId)
      .single();

    if (accountError) {
      console.error('❌ Error fetching account user:', accountError);
      return;
    }

    console.log('✅ Account user data:', JSON.stringify(accountUser, null, 2));
    
    if (accountUser?.accounts?.[0]) {
      const account = accountUser.accounts[0];
      console.log('\n📊 Account Summary:');
      console.log('  Plan:', account.plan);
      console.log('  Max Users:', account.max_users);
      console.log('  Stripe Customer ID:', account.stripe_customer_id);
      console.log('  Stripe Subscription ID:', account.stripe_subscription_id);
      console.log('  Subscription Status:', account.subscription_status);
      console.log('  Has Had Paid Plan:', account.has_had_paid_plan);
    }

    // Check user count
    const { data: userCount, error: countError } = await supabase
      .rpc('get_account_user_count', { account_uuid: accountUser.account_id });

    if (countError) {
      console.error('❌ Error getting user count:', countError);
    } else {
      console.log('  Current Users:', userCount);
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkAccountData(); 