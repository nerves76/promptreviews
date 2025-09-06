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

// Keep references to other contexts that might be used
export { usePaymentState } from './PaymentContext';
export { useSessionState } from './SessionContext';

// Re-export types
export type { User, Session } from '@supabase/supabase-js';
export type { Account } from '../types';