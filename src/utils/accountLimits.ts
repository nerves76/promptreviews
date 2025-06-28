import { SupabaseClient } from "@supabase/supabase-js";
import { getAccountIdForUser } from "./accountUtils";

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
  if (account.is_free_account) {
    return { allowed: true };
  }
  // Check plan and trial
  const now = new Date();
  const inTrial = account.trial_end && new Date(account.trial_end) > now;
  let limit = 0;
  if (account.plan === "grower") {
    limit = type === "prompt_page" ? 4 : Infinity; // Only limit custom prompt pages
    if (!inTrial && !account.is_free_account_account_account) {
      return { allowed: false, reason: "Trial ended. Please upgrade." };
    }
  } else if (account.plan === "builder") {
    limit = 100;
  } else if (account.plan === "community_champion") {
    limit = 500;
  } else if (account.plan === "free") {
    return { allowed: true };
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
  const now = new Date();
  const trialEnd = account.trial_end ? new Date(account.trial_end) : null;
  const isTrialExpired = trialEnd && now > trialEnd;
  const isPaid = account.plan !== "grower" || account.is_free_account;
  return Boolean(isTrialExpired && !isPaid);
}
