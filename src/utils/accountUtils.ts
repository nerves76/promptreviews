/**
 * Account management utilities for multi-user account support
 * This file provides functions for managing account users and permissions
 */

import { SupabaseClient } from '@supabase/supabase-js';

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

  return data?.map(item => item.accounts).filter(Boolean) || [];
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