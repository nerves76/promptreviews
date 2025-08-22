# Billing Messaging System

## Overview
This document describes the comprehensive messaging system for handling all 30 possible plan upgrade/downgrade combinations in PromptReviews.

## System Architecture

### Core Components

1. **`/src/lib/billing/planMessages.ts`** (< 300 lines)
   - Central messaging logic
   - Handles all 30 plan transition combinations
   - Generates appropriate messages based on plan changes
   - Feature difference calculation

2. **`/src/components/billing/PlanTransitionModal.tsx`** (< 150 lines)
   - Reusable modal component for plan transitions
   - Handles upgrade/downgrade/billing change confirmations
   - Shows appropriate benefits or warnings
   - Processing state with Stripe branding

3. **`/src/components/billing/SuccessModal.tsx`** (< 150 lines)
   - Success confirmation modal
   - Different messages for upgrades, downgrades, billing changes
   - Crompty mascot for new users
   - Contextual tips and warnings

## Plan Combinations Matrix

### Plans (3)
- Grower (Basic)
- Builder (Professional)
- Maven (Enterprise)

### Billing Periods (2)
- Monthly
- Annual (15% discount)

### Total Combinations: 30
- **Upgrades**: 12 combinations
- **Downgrades**: 12 combinations
- **Billing Changes**: 6 combinations

## Message Types

### Upgrade Messages
Shows gained features:
- Team member increases
- Prompt Page increases
- Contact upload capabilities
- Google Business Profile access
- Workflow management
- Multi-location support

Example: Grower → Builder
```
Title: "Upgrade to Builder"
Subtitle: "Unlock powerful features to grow your review collection"
Benefits:
✓ 3 team members (up from 1)
✓ 50 Prompt Pages (up from 3)
✓ 1,000 contacts upload capability
✓ Google Business Profile management
✓ Workflow management
```

### Downgrade Messages
Shows lost features:
- Feature reductions
- Access removals
- Limit decreases

Example: Maven → Builder
```
Title: "Downgrade to Builder"
Subtitle: "Reduce your plan to Builder features"
Warnings:
✗ Limited to 3 team members
✗ Reduced to 50 Prompt Pages
✗ Reduced to 1,000 contacts
✗ Limited to 1 location
```

### Billing Period Changes
Shows savings or flexibility:

Annual Switch:
```
Title: "Switch to Annual Billing"
Benefits:
✓ Save 15% compared to monthly billing
✓ Lock in your rate for the full year
✓ Simplified billing with one annual payment
```

## Implementation Usage

### In Plan Page
```typescript
import PlanTransitionModal from '@/components/billing/PlanTransitionModal';
import SuccessModal from '@/components/billing/SuccessModal';

// For plan changes
<PlanTransitionModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleConfirm}
  currentPlan="grower"
  currentBilling="monthly"
  targetPlan="builder"
  targetBilling="annual"
  isProcessing={processing}
/>

// For success
<SuccessModal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  action="upgrade"
  fromPlan="grower"
  toPlan="builder"
/>
```

## Testing

### Test Coverage
The system includes comprehensive tests in `/src/lib/billing/__tests__/planMessages.test.ts`:

1. **All 30 combinations validated**
2. **Message content verification**
3. **Feature list accuracy**
4. **Button styling consistency**
5. **Icon appropriateness**

### Running Tests
```bash
npm test planMessages.test.ts
```

## Feature Tracking

### Grower Plan
- 1 team member
- 3 Prompt Pages
- 0 contacts
- 1 location
- No Google Business
- No Workflow

### Builder Plan
- 3 team members
- 50 Prompt Pages
- 1,000 contacts
- 1 location
- Google Business Profile
- Workflow management

### Maven Plan
- 5 team members
- 500 Prompt Pages
- 10,000 contacts
- 10 locations
- Google Business Profile
- Workflow management

## Message Customization

To modify messages for specific transitions, edit the message maps in `planMessages.ts`:

```typescript
const messages: Record<string, PlanTransitionMessage> = {
  'grower-builder-monthly': {
    title: 'Upgrade to Builder',
    subtitle: 'Your custom subtitle',
    // ... custom configuration
  }
};
```

## Best Practices

1. **Keep messages concise** - Users should quickly understand the impact
2. **Use color coding** - Green for benefits, red for warnings
3. **Show specifics** - Exact numbers for limits and features
4. **Maintain consistency** - Same terminology across all messages
5. **Test thoroughly** - All 30 combinations should work seamlessly

## Maintenance

When adding new plans or features:

1. Update `PLAN_FEATURES` in `planMessages.ts`
2. Add new feature comparisons in `getFeatureDifferences()`
3. Update test cases for new combinations
4. Verify all existing combinations still work

## Related Documentation

- `/docs/BILLING_SYSTEM_UPDATE_2024.md` - Stripe integration details
- `/CLAUDE.md` - General project guidelines
- `/src/app/api/preview-billing-change/route.ts` - Proration calculations