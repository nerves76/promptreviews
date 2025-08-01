import { SupabaseClient } from "@supabase/supabase-js";
import { getAccountIdForUser } from "./accountUtils";

// Plan limits configuration
const PLAN_LIMITS = {
  grower: {
    prompt_page: 3, // 3 custom prompt pages
    contact: 0, // Cannot upload contacts
  },
  builder: {
    prompt_page: 50, // 50 prompt pages
    contact: 1000, // 1000 contacts
  },
  maven: {
    prompt_page: 500, // 500 prompt pages
    contact: 10000, // 10,000 contacts
  },
  community_champion: {
    prompt_page: 500,
    contact: 10000,
  },
  free: {
    prompt_page: Infinity,
    contact: Infinity,
  },
} as const;

export async function checkAccountLimits(
  supabase: SupabaseClient,
  userId: string,
  type: "prompt_page" | "contact",
) {
  // Get account ID using the utility function
  const accountId = await getAccountIdForUser(userId, supabase);
  
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
    const freePlanLevel = account.free_plan_level || 'free'; // Default to 'free' for unlimited
    const limits = PLAN_LIMITS[freePlanLevel as keyof typeof PLAN_LIMITS];
    
    if (!limits) {
      // If free_plan_level is not recognized, default to no limits (legacy behavior)
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
  let limit: number;
  if (type === "prompt_page") {
    limit = account.max_prompt_pages || PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.prompt_page || 3;
  } else if (type === "contact") {
    limit = account.max_contacts || PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.contact || 0;
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

export async function isAccountBlocked(
  supabase: any,
  userId: string,
): Promise<boolean> {
  // Get account ID using the utility function
  const accountId = await getAccountIdForUser(userId, supabase);
  
  if (!accountId) {
    return false;
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .single();
  if (!account) return false;

  // Free accounts are never blocked
  if (account.is_free_account) {
    return false;
  }

  // Check if trial expired for non-free accounts
  const now = new Date();
  const trialEnd = account.trial_end ? new Date(account.trial_end) : null;
  const isTrialExpired = trialEnd && now > trialEnd;
  const hasPaidSubscription = account.stripe_customer_id && account.subscription_status === 'active';
  const isPaidPlan = account.plan !== "grower" && account.plan !== "no_plan";
  
  // Block if trial expired and no paid subscription
  return Boolean(isTrialExpired && !hasPaidSubscription && !isPaidPlan);
}
