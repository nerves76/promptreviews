/**
 * Account Selection State Management (Server-Safe)
 * Handles user's manual account selection for multi-account support
 */

import { createClient } from '../providers/supabase';

const SELECTED_ACCOUNT_KEY = 'promptreviews_selected_account';

export interface UserAccount {
  account_id: string;
  role: 'owner' | 'admin' | 'member' | 'support' | 'agency_manager' | 'agency_billing_manager';
  account_name?: string;
  plan?: string;
  first_name?: string;
  last_name?: string;
  business_name?: string;
  is_primary?: boolean; // The account that would be selected by default algorithm
  is_agncy?: boolean; // Whether this account is an agency account
  is_client_account?: boolean; // Whether this account is a client account
}

/**
 * Get user's manually selected account from localStorage
 */
export function getStoredAccountSelection(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(`${SELECTED_ACCOUNT_KEY}_${userId}`);
    return stored;
  } catch (error) {
    console.error('Error reading stored account selection:', error);
    return null;
  }
}

/**
 * Store user's account selection in localStorage
 */
export function setStoredAccountSelection(userId: string, accountId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`${SELECTED_ACCOUNT_KEY}_${userId}`, accountId);
  } catch (error) {
    console.error('Error storing account selection:', error);
  }
}

/**
 * Clear stored account selection
 */
export function clearStoredAccountSelection(userId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`${SELECTED_ACCOUNT_KEY}_${userId}`);
  } catch (error) {
    console.error('Error clearing stored account selection:', error);
  }
}

/**
 * Fetch user's available accounts
 * Includes both direct account memberships AND agency-managed client accounts
 */
export async function fetchUserAccounts(userId: string, supabaseClient?: any): Promise<UserAccount[]> {
  try {
    const client = supabaseClient || createClient();

    // 1. Fetch direct account memberships (account_users table)
    const { data: accountUsers, error } = await client
      .from("account_users")
      .select(`
        account_id,
        role,
        accounts!inner (
          id,
          first_name,
          last_name,
          business_name,
          plan,
          is_agncy,
          is_client_account
        )
      `)
      .eq("user_id", userId);

    if (error) {
      console.error('Error fetching user accounts:', error);
      return [];
    }

    const directAccounts: UserAccount[] = accountUsers?.map((au: any) => ({
      account_id: au.account_id,
      role: au.role,
      account_name: au.accounts.business_name || `${au.accounts.first_name} ${au.accounts.last_name}`.trim(),
      plan: au.accounts.plan,
      first_name: au.accounts.first_name,
      last_name: au.accounts.last_name,
      business_name: au.accounts.business_name,
      is_agncy: au.accounts.is_agncy || false,
      is_client_account: au.accounts.is_client_account || false,
    })) || [];

    // 2. Find agency accounts that this user owns/admins
    const agencyAccountIds = directAccounts
      .filter(acc => acc.is_agncy && (acc.role === 'owner' || acc.role === 'admin'))
      .map(acc => acc.account_id);

    let agencyClientAccounts: UserAccount[] = [];

    // 3. Fetch client accounts managed by those agencies (via managing_agncy_id)
    if (agencyAccountIds.length > 0) {
      const { data: managedClients, error: managedError } = await client
        .from("accounts")
        .select(`
          id,
          first_name,
          last_name,
          business_name,
          plan,
          is_agncy,
          is_client_account
        `)
        .in("managing_agncy_id", agencyAccountIds)
        .is("deleted_at", null);

      if (managedError) {
        console.error('Error fetching agency-managed clients:', managedError);
      } else {
        agencyClientAccounts = managedClients?.map((acc: any) => ({
          account_id: acc.id,
          role: 'agency_manager' as UserAccount['role'],
          account_name: acc.business_name || `${acc.first_name || ''} ${acc.last_name || ''}`.trim(),
          plan: acc.plan,
          first_name: acc.first_name,
          last_name: acc.last_name,
          business_name: acc.business_name,
          is_agncy: acc.is_agncy || false,
          is_client_account: acc.is_client_account || false,
        })) || [];
      }
    }

    // 4. Merge and dedupe (in case an account appears in both)
    const allAccounts = [...directAccounts];
    const existingIds = new Set(directAccounts.map(a => a.account_id));

    for (const clientAccount of agencyClientAccounts) {
      if (!existingIds.has(clientAccount.account_id)) {
        allAccounts.push(clientAccount);
        existingIds.add(clientAccount.account_id);
      }
    }

    return allAccounts;
  } catch (error) {
    console.error('Error fetching user accounts:', error);
    return [];
  }
}

/**
 * Select the best account for the user based on priority rules
 */
export function selectBestAccount(accounts: UserAccount[]): UserAccount | null {
  if (!accounts || accounts.length === 0) return null;
  
  // Priority 1: Owner account
  const ownerAccount = accounts.find(a => a.role === 'owner');
  if (ownerAccount) return ownerAccount;
  
  // Priority 2: Admin account
  const adminAccount = accounts.find(a => a.role === 'admin');
  if (adminAccount) return adminAccount;
  
  // Priority 3: First member account
  return accounts[0];
}

/**
 * Get the account ID that should be used for this user
 * Respects manual selection if valid, otherwise returns null for default algorithm
 */
export async function getUserSelectedAccountId(userId: string, supabaseClient?: any): Promise<string | null> {
  // Get stored selection
  const storedAccountId = getStoredAccountSelection(userId);
  
  if (!storedAccountId) {
    return null;
  }

  // Validate that the stored account still exists and user has access
  try {
    const client = supabaseClient || createClient();
    
    const { data: accountUser, error } = await client
      .from("account_users")
      .select("account_id")
      .eq("user_id", userId)
      .eq("account_id", storedAccountId)
      .single();

    if (error || !accountUser) {
      // Stored selection is invalid, clear it
      clearStoredAccountSelection(userId);
      return null;
    }

    return storedAccountId;
  } catch (error) {
    console.error('Error validating stored account selection:', error);
    return null;
  }
} 