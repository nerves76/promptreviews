/**
 * Auth Context Module Exports
 * 
 * This file provides centralized exports for all auth contexts
 */

// Main composite provider and hook
export { CompositeAuthProvider, useAuth } from './CompositeAuthProvider';

// Individual context providers and hooks
export { CoreAuthProvider, useCoreAuth } from './CoreAuthContext';
export { AccountProvider, useAccount } from './AccountContext';
export { BusinessProvider, useBusiness } from './BusinessContext';
export { AdminProvider, useAdmin, useAdminGuard } from './AdminContext';
export { SubscriptionProvider, useSubscription } from './SubscriptionContext';

// Legacy exports for backward compatibility
export { 
  AuthProvider,
  AuthContext,
  useAuthGuard,
  useBusinessGuard
} from './AuthContext';

// Keep references to other contexts that might be used
export { usePaymentState } from './PaymentContext';
export { useSessionState } from './SessionContext';

// Re-export types
export type { User, Session } from '@supabase/supabase-js';
export type { Account } from '../types';