/**
 * Test Account Limits Script
 * 
 * This script tests the account limits functionality for the Maven plan.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLimits() {
  console.log('🔍 Testing Account Limits for Maven Plan');
  console.log('==========================================');

  try {
    const userId = '48992937-3386-4079-84cd-08dafe466cd7';
    
    // Get account details
    const { data: account } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', userId)
      .single();
    
    console.log('Account details:');
    console.log(`  Plan: ${account.plan}`);
    console.log(`  Max prompt pages: ${account.max_prompt_pages}`);
    console.log(`  Max contacts: ${account.max_contacts}`);
    
    // Count current prompt pages
    const { count: promptPageCount } = await supabase
      .from('prompt_pages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', userId)
      .neq('is_universal', true);
    
    console.log(`Current non-universal prompt pages: ${promptPageCount}`);
    
    // Test the limit check
    const { allowed, reason, limit } = await checkAccountLimits(supabase, userId, 'prompt_page');
    
    console.log('\nLimit check result:');
    console.log(`  Allowed: ${allowed}`);
    console.log(`  Reason: ${reason}`);
    console.log(`  Limit: ${limit}`);
    
    if (allowed) {
      console.log('✅ User can create more prompt pages');
    } else {
      console.log('❌ User cannot create more prompt pages');
    }
    
  } catch (error) {
    console.error('❌ Error testing limits:', error);
  }
}

// Import the checkAccountLimits function
async function checkAccountLimits(supabase, userId, type) {
  // Get account ID using the utility function
  const accountId = userId; // For this test, userId is the accountId
  
  if (!accountId) {
    return { allowed: false, reason: "Account not found" };
  }

  // Fetch account using the account ID
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .single();
  if (accountError || !account) {
    return { allowed: false, reason: "Account not found" };
  }

  // Handle free accounts with plan-based limits
  if (account.is_free_account) {
    const freePlanLevel = account.free_plan_level || 'free';
    const PLAN_LIMITS = {
      grower: { prompt_page: 3, contact: 0 },
      builder: { prompt_page: 50, contact: 1000 },
      maven: { prompt_page: 500, contact: 10000 },
      community_champion: { prompt_page: 500, contact: 10000 },
      free: { prompt_page: Infinity, contact: Infinity },
    };
    
    const limits = PLAN_LIMITS[freePlanLevel];
    
    if (!limits) {
      return { allowed: true };
    }

    const limit = limits[type];
    if (limit === Infinity) {
      return { allowed: true };
    }

    // Count current usage for free accounts with limits
    let count = 0;
    if (type === "prompt_page") {
      const { count: promptPageCount } = await supabase
        .from("prompt_pages")
        .select("*", { count: "exact", head: true })
        .eq("account_id", accountId)
        .neq("is_universal", true);
      count = promptPageCount || 0;
    } else if (type === "contact") {
      const { count: contactCount } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("account_id", accountId);
      count = contactCount || 0;
    }

    if (count >= limit) {
      return {
        allowed: false,
        reason: `Free account limit reached (${limit} ${type === "prompt_page" ? "prompt pages" : "contacts"}).`,
        limit,
      };
    }
    
    return { allowed: true };
  }

  // Handle paid accounts with trial and subscription logic
  const now = new Date();
  const inTrial = account.trial_end && new Date(account.trial_end) > now;
  const plan = account.plan || 'grower';
  
  // Use actual account limits from database instead of hardcoded limits
  let limit;
  if (type === "prompt_page") {
    limit = account.max_prompt_pages || 3;
  } else if (type === "contact") {
    limit = account.max_contacts || 0;
  } else {
    return { allowed: false, reason: "Invalid type" };
  }
  
  // Check if trial ended for grower accounts without payment
  if (plan === "grower" && !inTrial && !account.stripe_customer_id) {
    return { allowed: false, reason: "Trial ended. Please upgrade." };
  }

  // Count current usage
  let count = 0;
  if (type === "prompt_page") {
    const { count: promptPageCount } = await supabase
      .from("prompt_pages")
      .select("*", { count: "exact", head: true })
      .eq("account_id", accountId)
      .neq("is_universal", true);
    count = promptPageCount || 0;
  } else if (type === "contact") {
    const { count: contactCount } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("account_id", accountId);
    count = contactCount || 0;
  }

  if (limit !== Infinity && count >= limit) {
    return {
      allowed: false,
      reason: `Limit reached for your plan (${limit} ${type === "prompt_page" ? "prompt pages" : "contacts"}).`,
      limit,
    };
  }
  
  return { allowed: true };
}

testLimits(); 