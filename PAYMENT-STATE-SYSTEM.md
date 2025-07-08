# 💳 Comprehensive Payment State Management System

## Overview

This document describes the comprehensive payment state management system built with Stripe integration, providing real-time payment states, trial management, and access control for a fully functional SaaS application.

## ✨ Features

### Core Payment States
- **Subscription Status**: `active`, `trialing`, `past_due`, `canceled`, `incomplete`, `unpaid`, `paused`
- **Payment Status**: `current`, `past_due`, `canceled`, `requires_payment_method`, `requires_action`
- **Trial Status**: `active`, `expired`, `converted`, `none`
- **Plan Management**: `currentPlan`, `planTier`, `hasActivePlan`, `requiresPlanSelection`
- **Payment Method**: `valid`, `expired`, `requires_action`, `missing`
- **Account Lifecycle**: `active`, `suspended`, `canceled`, `requires_action`
- **Access Control**: `full`, `limited`, `suspended`

### Advanced Features
- **Trial Management**: Days remaining, expiration warnings, conversion tracking
- **Access Control**: Feature-based permissions, plan-based restrictions
- **Payment Method Validation**: Real-time status, expiration tracking
- **Account Lifecycle**: Soft deletion, reactivation detection
- **Billing History**: Paid plan history, reactivation status

## 🏗️ Architecture

### AuthContext Enhanced
The `AuthContext` has been enhanced with 20+ new payment states and functions:

```typescript
interface AuthState {
  // Payment States
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | null;
  paymentStatus: 'current' | 'past_due' | 'requires_payment_method' | null;
  trialStatus: 'active' | 'expired' | 'converted' | 'none';
  trialDaysRemaining: number;
  isTrialExpiringSoon: boolean;
  
  // Plan Management
  currentPlan: string | null;
  planTier: 'free' | 'tier1' | 'tier2' | 'tier3' | 'enterprise' | null;
  hasActivePlan: boolean;
  requiresPlanSelection: boolean;
  
  // Access Control
  accountStatus: 'active' | 'suspended' | 'canceled' | 'requires_action';
  canAccessFeatures: boolean;
  accessLevel: 'full' | 'limited' | 'suspended';
  
  // Validation Functions
  requireActivePlan: () => boolean;
  requirePaymentMethod: () => boolean;
  refreshPaymentStatus: () => Promise<void>;
}
```

### Stripe Webhook Integration
Enhanced webhook handling for comprehensive payment events:

```typescript
// Subscription Events
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- customer.subscription.trial_will_end
- customer.subscription.paused
- customer.subscription.resumed

// Payment Events
- invoice.payment_succeeded
- invoice.payment_failed
```

### Database Schema
Utilizes existing Stripe-related columns in the `accounts` table:

```sql
-- Stripe Integration Fields
stripe_customer_id TEXT
stripe_subscription_id TEXT
subscription_status TEXT
plan TEXT
plan_lookup_key TEXT

-- Trial Management
trial_start TIMESTAMP WITH TIME ZONE
trial_end TIMESTAMP WITH TIME ZONE

-- Account Lifecycle
has_had_paid_plan BOOLEAN
is_free_account BOOLEAN
deleted_at TIMESTAMP WITH TIME ZONE
```

## 🎯 Usage Examples

### 1. Basic Payment State Checking

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { 
    subscriptionStatus, 
    trialStatus, 
    hasActivePlan,
    canAccessFeatures 
  } = useAuth();

  // Check if user can access features
  if (canAccessFeatures) {
    return <PremiumFeature />;
  }

  // Show upgrade prompt
  return <UpgradePrompt />;
}
```

### 2. Feature Access Control

```typescript
function PremiumFeature() {
  const { requireActivePlan } = useAuth();

  const handlePremiumAction = () => {
    if (requireActivePlan()) {
      // User has active plan, proceed
      performPremiumAction();
    }
    // If false, error is automatically set in AuthContext
  };

  return (
    <button onClick={handlePremiumAction}>
      Premium Action
    </button>
  );
}
```

### 3. Trial Management

```typescript
function TrialBanner() {
  const { 
    trialStatus, 
    trialDaysRemaining, 
    isTrialExpiringSoon 
  } = useAuth();

  if (isTrialExpiringSoon) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-800">Trial Expiring Soon!</h3>
        <p className="text-red-700">
          Your trial expires in {trialDaysRemaining} days. 
          Please select a plan to continue.
        </p>
      </div>
    );
  }

  if (trialStatus === 'expired') {
    return <PlanSelectionModal />;
  }

  return null;
}
```

### 4. Payment Method Validation

```typescript
function PaymentMethodStatus() {
  const { 
    paymentMethodStatus, 
    hasPaymentMethod,
    requirePaymentMethod 
  } = useAuth();

  if (paymentMethodStatus === 'expired') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800">Payment Method Expired</h3>
        <p className="text-yellow-700">
          Please update your payment method to avoid service interruption.
        </p>
      </div>
    );
  }

  const handleSubscriptionChange = () => {
    if (requirePaymentMethod()) {
      // Proceed with subscription change
    }
  };

  return (
    <button onClick={handleSubscriptionChange}>
      Change Subscription
    </button>
  );
}
```

## 🔧 Components

### PaymentStatus Component
Comprehensive payment status dashboard:

```typescript
import PaymentStatus from '@/app/components/PaymentStatus';

function Dashboard() {
  return (
    <div>
      <PaymentStatus showDebug={true} />
    </div>
  );
}
```

### PaymentStateExamples Component
Usage examples for different payment states:

```typescript
import { PaymentStateExamples } from '@/app/components/PaymentStatus';

function DemoPage() {
  return (
    <div>
      <PaymentStateExamples />
    </div>
  );
}
```

## 🎨 Demo Page

Visit `/payment-demo` to see the comprehensive payment state management system in action:

- Real-time payment status dashboard
- Feature access control demonstrations
- Trial management examples
- Payment method validation
- Implementation code examples

## 🛡️ Access Control Patterns

### Feature-Based Access Control

```typescript
// Basic features (available during trial and paid plans)
if (canAccessFeatures) {
  // Show feature
}

// Premium features (require active paid plan)
if (hasActivePlan) {
  // Show premium feature
}

// Enterprise features (require full access level)
if (accessLevel === 'full') {
  // Show enterprise feature
}
```

### Plan-Based Restrictions

```typescript
// Check plan tier
switch (planTier) {
  case 'tier1':
    // Show tier 1 features
    break;
  case 'tier2':
    // Show tier 2 features
    break;
  case 'tier3':
    // Show tier 3 features
    break;
  case 'enterprise':
    // Show enterprise features
    break;
}
```

### Trial vs Paid Plan Differentiation

```typescript
// Different UI based on trial status
if (trialStatus === 'active' && !hasActivePlan) {
  return <TrialUserInterface />;
}

if (hasActivePlan) {
  return <PaidUserInterface />;
}

return <FreeUserInterface />;
```

## 🔄 Stripe Webhook Flow

1. **User subscribes** → Stripe sends `customer.subscription.created`
2. **Payment succeeds** → Stripe sends `invoice.payment_succeeded`
3. **Payment fails** → Stripe sends `invoice.payment_failed`
4. **Trial ends** → Stripe sends `customer.subscription.trial_will_end`
5. **Subscription cancels** → Stripe sends `customer.subscription.deleted`

Each event updates the database with the latest payment state, which is immediately reflected in the UI through the AuthContext.

## 📊 Database Updates

The Stripe webhook automatically updates:

```sql
UPDATE accounts SET
  subscription_status = 'active',
  stripe_subscription_id = 'sub_xxx',
  plan = 'builder',
  plan_lookup_key = 'builder_35',
  max_users = 3,
  max_locations = 0,
  has_had_paid_plan = true
WHERE stripe_customer_id = 'cus_xxx';
```

## 🚀 Benefits

1. **Real-time Payment States**: Immediate UI updates from Stripe webhooks
2. **Comprehensive Access Control**: Feature-based, plan-based, and trial-based restrictions
3. **Automated Trial Management**: Expiration warnings, conversion tracking
4. **Payment Method Validation**: Proactive validation before subscription changes
5. **Account Lifecycle Management**: Soft deletion, reactivation detection
6. **Developer-Friendly**: Simple hooks and components for easy integration
7. **Scalable Architecture**: Ready for enterprise-level SaaS applications

## 🔮 Future Enhancements

- **Dunning Management**: Automated retry logic for failed payments
- **Usage-Based Billing**: Metered billing integration
- **Multi-Currency Support**: International payment processing
- **Advanced Analytics**: Payment success rates, churn analysis
- **Custom Billing Cycles**: Flexible subscription periods
- **Proration Handling**: Mid-cycle plan changes

## 📋 Testing

Test the system by:

1. Visiting `/payment-demo` to see all payment states
2. Creating test subscriptions in Stripe dashboard
3. Triggering webhook events in Stripe
4. Monitoring real-time state changes in the UI
5. Testing feature access control with different plan types

This comprehensive payment state management system provides everything needed for a fully functional SaaS billing system with Stripe integration. 