/**
 * Central authentication module exports
 * Use this file to import auth-related functionality
 */

// Context and Provider
export { AuthProvider, AuthContext } from './context/AuthContext';

// Hooks
export {
  useAuth,
  useAuthGuard,
  useAdminGuard,
  useBusinessGuard,
  useUser,
  useIsAdmin,
  useAccount,
  useHasBusiness,
  usePaymentStatus
} from './hooks';

// Types
export type {
  AuthState,
  AuthContextType,
  Account,
  AccountUser,
  UserAccount
} from './types';

// Utils
export { isAdmin, ensureAdminForEmail, setAdminStatus, listAdmins } from './utils/admin';
export { 
  getUserAccounts,
  getAccountsForUser,
  getAccountUsers,
  addUserToAccount,
  removeUserFromAccount,
  removeUserFromAccountWithCleanup,
  updateUserRole,
  userHasRole,
  ensureAccountExists,
  getAccountIdForUser,
  getCurrentUserAccountId
} from './utils/accounts';
export {
  getStoredAccountSelection,
  setStoredAccountSelection,
  clearStoredAccountSelection,
  fetchUserAccounts,
  getUserSelectedAccountId
} from './utils/accountSelection';

// Guards
export { BusinessGuard } from './guards/BusinessGuard';

// Providers
export { createClient, getUserOrMock } from './providers/supabase';

// Debug Tools
export { AuthDebugger } from './debug/AuthDebugger';