/**
 * Account management utilities for multi-user account support
 * This file provides functions for managing account users and permissions
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from "@supabase/supabase-js";
import { getUserOrMock } from "./supabaseClient";

export interface AccountUser {
  account_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface Account {
  id: string;
  name?: string;
  created_at: string;
}

/**
 * Get all accounts that a user belongs to
 * @param supabase - Supabase client instance
 * @param userId - User ID to get accounts for
 * @returns Array of accounts the user belongs to
 */
export async function getUserAccounts(
  supabase: SupabaseClient,
  userId: string
): Promise<Account[]> {
  const { data, error } = await supabase
    .from('account_users')
    .select(`
      account_id,
      accounts (
        id,
        name,
        created_at
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user accounts:', error);
    throw error;
  }

  return data?.map(item => item.accounts).filter(Boolean).flat() || [];
}

/**
 * Get all users in an account
 * @param supabase - Supabase client instance
 * @param accountId - Account ID to get users for
 * @returns Array of users in the account
 */
export async function getAccountUsers(
  supabase: SupabaseClient,
  accountId: string
): Promise<AccountUser[]> {
  const { data, error } = await supabase
    .from('account_users')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching account users:', error);
    throw error;
  }

  return data || [];
}

/**
 * Add a user to an account
 * @param supabase - Supabase client instance
 * @param accountId - Account ID to add user to
 * @param userId - User ID to add
 * @param role - Role for the user (default: 'member')
 * @returns Success status
 */
export async function addUserToAccount(
  supabase: SupabaseClient,
  accountId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' = 'member'
): Promise<boolean> {
  const { error } = await supabase
    .from('account_users')
    .insert({
      account_id: accountId,
      user_id: userId,
      role
    });

  if (error) {
    console.error('Error adding user to account:', error);
    throw error;
  }

  return true;
}

/**
 * Remove a user from an account
 * @param supabase - Supabase client instance
 * @param accountId - Account ID to remove user from
 * @param userId - User ID to remove
 * @returns Success status
 */
export async function removeUserFromAccount(
  supabase: SupabaseClient,
  accountId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('account_users')
    .delete()
    .eq('account_id', accountId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing user from account:', error);
    throw error;
  }

  return true;
}

/**
 * Update a user's role in an account
 * @param supabase - Supabase client instance
 * @param accountId - Account ID
 * @param userId - User ID to update
 * @param role - New role for the user
 * @returns Success status
 */
export async function updateUserRole(
  supabase: SupabaseClient,
  accountId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member'
): Promise<boolean> {
  const { error } = await supabase
    .from('account_users')
    .update({ role })
    .eq('account_id', accountId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }

  return true;
}

/**
 * Check if a user has a specific role in an account
 * @param supabase - Supabase client instance
 * @param accountId - Account ID to check
 * @param userId - User ID to check
 * @param role - Role to check for
 * @returns True if user has the role or higher
 */
export async function userHasRole(
  supabase: SupabaseClient,
  accountId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member'
): Promise<boolean> {
  const roleHierarchy = { owner: 3, admin: 2, member: 1 };
  const requiredLevel = roleHierarchy[role];

  const { data, error } = await supabase
    .from('account_users')
    .select('role')
    .eq('account_id', accountId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  const userLevel = roleHierarchy[data.role as keyof typeof roleHierarchy];
  return userLevel >= requiredLevel;
}

/**
 * Ensure an account exists for a user, creating one if it doesn't exist
 * @param supabase - Supabase client instance
 * @param userId - User ID to ensure account for
 * @returns The account ID
 */
export async function ensureAccountExists(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    // Check if account already exists via account_users table
    const { data: accountUser, error: accountUserError } = await supabase
      .from("account_users")
      .select("account_id")
      .eq("user_id", userId)
      .single();

    if (accountUser && accountUser.account_id) {
      return accountUser.account_id;
    }

    // If no account exists, create one
    if (!accountUser) {
      // Get user data to populate account fields
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user data:", userError);
        throw userError;
      }

      const user = userData.user;
      const firstName = user?.user_metadata?.first_name || "";
      const lastName = user?.user_metadata?.last_name || "";
      const email = user?.email || "";

      // Create a new account with a generated UUID
      const { data: newAccount, error: createError } = await supabase
        .from("accounts")
        .insert({
          user_id: userId,
          email,
          trial_start: new Date().toISOString(),
          trial_end: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          is_free_account: false,
          custom_prompt_page_count: 0,
          contact_count: 0,
          first_name: firstName,
          last_name: lastName,
        })
        .select()
        .single();

      if (createError) {
        console.error("Account creation error:", createError);
        throw createError;
      }

      // Create the account_users relationship
      const { error: upsertAccountUserError } = await supabase
        .from("account_users")
        .insert({
          user_id: userId,
          account_id: newAccount.id,
          role: "owner",
        });

      if (upsertAccountUserError) {
        console.error("Account user creation error:", upsertAccountUserError);
        throw upsertAccountUserError;
      }

      return newAccount.id;
    }

    return accountUser.account_id;
  } catch (err) {
    console.error("Account setup error:", err);
    throw err;
  }
}

/**
 * Get the account ID for a given user ID
 * @param userId - The user ID to get the account for
 * @param supabaseClient - Optional Supabase client instance. If not provided, creates a new one.
 * @returns Promise<string | null> - The account ID or null if not found
 */
export async function getAccountIdForUser(userId: string, supabaseClient?: any): Promise<string | null> {
  try {
    const client = supabaseClient || createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        }
      }
    );

    // First, check if user has an account via account_users table
    const { data: accountUser, error: accountUserError } = await client
      .from("account_users")
      .select("account_id")
      .eq("user_id", userId)
      .single();

    if (accountUser && accountUser.account_id) {
      return accountUser.account_id;
    }

    // If no account_user record found, check if there's a legacy account record
    const { data: legacyAccount, error: legacyError } = await client
      .from("accounts")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (legacyAccount && legacyAccount.id) {
      // Found a legacy account, create the account_user relationship
      const { error: insertError } = await client
        .from("account_users")
        .insert({
          account_id: legacyAccount.id,
          user_id: userId,
          role: 'owner'
        });

      if (!insertError) {
        return legacyAccount.id;
      }
    }

    // No account found - this is expected for new users
    return null;
  } catch (error) {
    console.error("Error in getAccountIdForUser:", error);
    return null;
  }
}

/**
 * Get the account ID for the current user
 * @param supabaseClient - Optional Supabase client instance. If not provided, creates a new one.
 * @returns Promise<string | null> - The account ID or null if not found
 */
export async function getCurrentUserAccountId(supabaseClient?: any): Promise<string | null> {
  try {
    const client = supabaseClient || createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        }
      }
    );

    const { data: { user } } = await getUserOrMock(client);
    if (!user) {
      return null;
    }

    return await getAccountIdForUser(user.id, client);
  } catch (error) {
    console.error("Error in getCurrentUserAccountId:", error);
    return null;
  }
} 