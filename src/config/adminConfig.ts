/**
 * Admin Configuration
 * 
 * Contains configuration for admin-only features like creating multiple accounts.
 * This can be expanded to include other admin permissions in the future.
 */

/**
 * Email addresses that are allowed to create new accounts
 * Add emails here to grant the ability to create multiple accounts
 */
export const ADMIN_EMAILS = [
  // Admin users who can create multiple accounts
  'chris@diviner.agency', // Primary admin
  // Add additional admin emails here
];

/**
 * Check if a user email has admin privileges for creating accounts
 */
export function canCreateAccounts(email: string): boolean {
  // Preview change: allow all users to create linked accounts
  // Previously restricted to ADMIN_EMAILS.
  return true;
}

/**
 * Check if a user has admin privileges (for future expansion)
 */
export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
