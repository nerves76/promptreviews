/**
 * Auth Context Module Exports
 * 
 * Updated for the new 3-context architecture (CoreAuth + AccountBusiness + Feature)
 */

// Main composite provider and hook
export { CompositeAuthProvider, useAuth } from './CompositeAuthProvider';

// New consolidated context providers and hooks
export { CoreAuthProvider, useCoreAuth } from './CoreAuthContext';
export { AccountBusinessProvider, useAccountBusiness, useAccount, useBusiness } from './AccountBusinessContext';
export { FeatureProvider, useFeatures, useAdmin, useSubscription, useAdminGuard } from './FeatureContext';

// Legacy exports for backward compatibility
export { 
  AuthProvider,
  AuthContext,
  useAuthGuard,
  useBusinessGuard
} from './AuthContext';

// Note: PaymentContext and SessionContext have been consolidated
// Payment and session state are now available via useFeatures() and useCoreAuth()

// Re-export types
export type { User, Session } from '@supabase/supabase-js';
export type { Account } from '../types';