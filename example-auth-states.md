# Enhanced Authentication States Usage Examples

This document shows how to use our enhanced AuthContext with email verification and future state planning.

## Current Enhanced States

### Email Verification
```typescript
import { useAuth } from '@/contexts/AuthContext';

function EmailVerificationBanner() {
  const { requiresEmailVerification, user } = useAuth();
  
  if (!requiresEmailVerification) return null;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <p className="text-yellow-800">
        Please verify your email address ({user?.email}) to access all features.
      </p>
      <button className="mt-2 text-yellow-600 underline">
        Resend verification email
      </button>
    </div>
  );
}
```

### Authentication State Detection
```typescript
function useAuthenticationStates() {
  const { 
    isAuthenticated, 
    emailVerified, 
    requiresEmailVerification,
    accountId,
    account,
    isAdminUser 
  } = useAuth();

  return {
    // Current states we can detect:
    isVisitor: !isAuthenticated,
    isAuthenticatedOwner: isAuthenticated && !!accountId,
    isAuthenticatedTeamMember: isAuthenticated && !accountId,
    requiresEmailVerification,
    isEmailVerified: emailVerified,
    isTrialActive: account?.trial_ends_at && new Date(account.trial_ends_at) > new Date(),
    isTrialExpired: account?.trial_ends_at && new Date(account.trial_ends_at) <= new Date(),
    isFreeTier: account?.is_free_account === true,
    isAdmin: isAdminUser
  };
}
```

## Future Enhanced States (Roadmap)

### High Priority Additions
```typescript
// These would be added to AuthContext in future iterations:

interface FutureAuthState {
  // Payment states (via Stripe webhooks)
  paymentStatus: 'active' | 'past_due' | 'canceled' | 'incomplete';
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'canceled';
  
  // Enhanced trial states
  trialStatus: 'active' | 'expired' | 'converted' | null;
  trialDaysRemaining: number | null;
  
  // Team role granularity
  teamRole: 'owner' | 'admin' | 'member' | 'pending' | null;
  teamPermissions: string[];
}
```

### Usage Examples for Future States
```typescript
// Payment Status Handling
function PaymentStatusBanner() {
  const { paymentStatus, subscriptionStatus } = useAuth(); // Future
  
  if (paymentStatus === 'past_due') {
    return <PastDueBanner />;
  }
  
  if (subscriptionStatus === 'canceled') {
    return <CanceledAccountBanner />;
  }
  
  return null;
}

// Team Role-Based Access
function AdminOnlySection({ children }) {
  const { teamRole } = useAuth(); // Future
  
  if (teamRole !== 'owner' && teamRole !== 'admin') {
    return null;
  }
  
  return <>{children}</>;
}
```

## Implementation Strategy

1. **Phase 1 (Current)**: Email verification ✅
2. **Phase 2**: Stripe payment state integration
3. **Phase 3**: Enhanced trial state tracking  
4. **Phase 4**: Granular team role management
5. **Phase 5**: Account lifecycle states

Each phase builds on the previous one while maintaining backward compatibility. 