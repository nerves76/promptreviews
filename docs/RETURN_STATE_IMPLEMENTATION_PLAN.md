# Prompt Page Return State - Implementation Plan

## Overview

When a customer clicks "Copy & Continue" on a Prompt Page, they're redirected to an external review site (Google, Yelp, etc.). Currently, we have no way to know if they actually posted the review or abandoned. This feature adds a "return state" that asks customers to confirm their review was posted.

## Current State

### What exists today:
- `review_submissions.status`: Only 2 values (`clicked`, `submitted`)
- Status is set to `submitted` **before** they leave for the external site
- `hasSubmitted` state in React shows helper buttons after redirect
- `auto_verification_status` field exists for Google review matching (`pending`, `verified`, `not_found`, `failed`)
- `verified` boolean field exists but unused

### Current flow:
1. Customer writes review → clicks "Copy & Continue"
2. API creates `review_submissions` record with `status: 'submitted'`
3. Review text copied to clipboard
4. External site opens in new tab
5. Customer pastes review on external site (we hope)
6. **Gap: No tracking of what happens next**

---

## Proposed Design

### New Fields (Database)

Add to `review_submissions` table:

| Field | Type | Values | Purpose |
|-------|------|--------|---------|
| `customer_confirmed` | TEXT | `null` / `'confirmed'` / `'needs_help'` | Self-reported completion |
| `customer_confirmed_at` | TIMESTAMPTZ | | When customer responded |

### Why separate from `status`?

Separating concerns:
1. **`status`** = workflow state (where are they in the process)
2. **`customer_confirmed`** = self-reported outcome (what did they say happened)
3. **`verified`** + `auto_verification_status` = system verification (what can we prove)

This lets us track:
- How many people clicked but never returned
- How many confirmed vs needed help
- Correlation between self-reported and system-verified

---

## UX Flow

### Step 1: After "Copy & Continue" Click

Customer clicks button → external site opens in new tab → **Prompt Page stays unchanged**.

The existing helper buttons remain visible:
- "Copy review" (to re-copy)
- "Visit [Platform]" (to re-open)

### Step 2: Customer Returns to Tab

When customer switches back to the Prompt Page tab (detected via `visibilitychange` event), immediately show the return state UI.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Did you get your review posted on Google?     │
│                                                 │
│   ┌───────────────────────────────────────┐     │
│   │       Yes, it's posted               │     │
│   └───────────────────────────────────────┘     │
│                                                 │
│   ┌───────────────────────────────────────┐     │
│   │    Not yet / I ran into an issue     │     │
│   └───────────────────────────────────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Step 2a: If "Yes, it's posted"

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ✓ Amazing — thank you!                        │
│                                                 │
│   Your review really helps [Business Name].     │
│                                                 │
│   You can close this tab now.                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

API call: `PATCH /api/track-review/confirm` with `customer_confirmed: 'confirmed'`

### Step 2b: If "Not yet / I ran into an issue"

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   No problem — here's the quick fix.            │
│                                                 │
│   1. Tap below to copy your review again.       │
│   2. Open Google and paste it in.               │
│                                                 │
│   ┌─────────────────┐  ┌─────────────────────┐  │
│   │  Copy review    │  │  Open Google again  │  │
│   └─────────────────┘  └─────────────────────┘  │
│                                                 │
│   Still stuck? Email support@promptreviews.app  │
│                                                 │
└─────────────────────────────────────────────────┘
```

API call: `PATCH /api/track-review/confirm` with `customer_confirmed: 'needs_help'`

---

## Technical: Tab Return Detection

```typescript
// In page-client.tsx, after successful submission:
const [pendingReturnStates, setPendingReturnStates] = useState<Map<number, {
  submissionId: string;
  reviewText: string;
  platformUrl: string;
  platformName: string;
}>>(new Map());

useEffect(() => {
  if (pendingReturnStates.size === 0) return;

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && pendingReturnStates.size > 0) {
      // Show return state immediately when user returns
      const latestIdx = Array.from(pendingReturnStates.keys()).pop();
      if (latestIdx !== undefined) {
        setActiveReturnState(latestIdx);
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [pendingReturnStates]);
```

### Edge Cases

1. **User never leaves tab** (popup blocked): After 30 seconds, show a gentler prompt: "Having trouble? Try copying your review again."

2. **User closes browser**: `sessionStorage` persists the pending state. On next visit (within session), show return state immediately.

3. **Multiple platforms**: Each platform tracks independently. If they submit to Google then Yelp, each gets its own return state question when they come back.

---

## Implementation Tasks

### Phase 1: Database Migration

**File:** `supabase/migrations/[timestamp]_add_customer_confirmed_fields.sql`

```sql
-- Add customer confirmation fields to review_submissions
ALTER TABLE review_submissions
ADD COLUMN customer_confirmed TEXT CHECK (customer_confirmed IN ('confirmed', 'needs_help')),
ADD COLUMN customer_confirmed_at TIMESTAMPTZ;

-- Add index for filtering by confirmation status
CREATE INDEX idx_review_submissions_customer_confirmed
ON review_submissions(customer_confirmed)
WHERE customer_confirmed IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN review_submissions.customer_confirmed IS 'Self-reported review completion: confirmed = posted, needs_help = had issues';
```

### Phase 2: API Endpoint

**File:** `src/app/(app)/api/track-review/confirm/route.ts`

```typescript
// PATCH /api/track-review/confirm
// Body: { submissionId: string, customer_confirmed: 'confirmed' | 'needs_help' }
// Updates the review_submission record with customer's self-reported status
```

### Phase 3: Frontend Components

**File:** `src/app/(app)/r/[slug]/components/ReturnStateCard.tsx`

New component that renders the return state UI:
- Props: `submissionId`, `platformName`, `reviewText`, `platformUrl`, `onConfirm`, `onNeedsHelp`
- States: `asking` | `confirmed` | `needs_help`
- Handles copy retry and re-open platform

**File:** `src/app/(app)/r/[slug]/page-client.tsx`

Modifications:
1. Store `submissionId` after successful API call (line ~934)
2. Track which platforms are in "return state" (new state)
3. Render `ReturnStateCard` instead of `ReviewPlatformCard` for submitted platforms

### Phase 4: State Persistence

Use `sessionStorage` to persist return state across page refreshes:
```typescript
// After successful submission
sessionStorage.setItem(`returnState_${promptPageId}_${idx}`, JSON.stringify({
  submissionId,
  reviewText,
  platformUrl,
  platformName,
  timestamp: Date.now()
}));
```

On page load, check for pending return states and restore UI.

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/migrations/[timestamp]_add_customer_confirmed_fields.sql` | New | Add DB columns |
| `prisma/schema.prisma` | Update | Add new fields (after db pull) |
| `src/app/(app)/api/track-review/confirm/route.ts` | New | Confirmation endpoint |
| `src/app/(app)/r/[slug]/components/ReturnStateCard.tsx` | New | Return state UI component |
| `src/app/(app)/r/[slug]/page-client.tsx` | Update | Integrate return state |
| `src/auth/providers/supabase.ts` | Update | Add types for new fields |

---

## Analytics & Reporting

### New Metrics Available

1. **Completion Rate**: `confirmed / (confirmed + needs_help + null)`
2. **Help Rate**: `needs_help / (confirmed + needs_help)`
3. **Abandonment Rate**: `null / total_submitted`
4. **Verification Match Rate**: `(confirmed AND verified) / confirmed`

### Dashboard Enhancement (Future)

Add to Reviews dashboard:
- "Pending Confirmation" count
- "Needs Help" alerts
- Funnel visualization: Submitted → Confirmed → Verified

---

## Copy Options (Per ChatGPT)

### Set 1 (Recommended - most universal)
- Headline: "Did you get your review posted on Google?"
- Yes: "Yes, it's posted"
- No: "Not yet — I need help"

### Set 2 (Warmer)
- Headline: "Quick check-in — were you able to post your review?"
- Yes: "Yes, all set"
- No: "Not yet / something came up"

### Set 3 (Explicit troubleshooting)
- Headline: "Were you able to successfully post your review on Google?"
- Yes: "Yes, I posted it"
- No: "No, something went wrong"

---

## Verification Hierarchy (Confirmed vs Verified)

### Three Levels of Trust

| Level | Field | Source | Meaning | UI Display |
|-------|-------|--------|---------|------------|
| 1. Customer Confirmed | `customer_confirmed` | Self-reported | Customer says they posted it | "Customer Confirmed" badge (yellow/amber) |
| 2. Manually Verified | `verified` | Business owner | Owner clicked "Mark as Verified" | "Verified" badge (green) - **existing** |
| 3. Auto-Verified | `auto_verification_status = 'verified'` | System (GBP API) | System found matching review on Google | "Auto-Verified" badge (green with checkmark) |

### Current `/dashboard/reviews` UI

Today the Reviews page shows:
- **"Verified" / "Not Verified" filter** - filters by `verified` boolean
- **"Mark as Verified" / "Un-verify" button** - toggles `verified` field
- Green badge when `verified = true`

### Proposed UI Updates

Add to the review card display:

```
┌────────────────────────────────────────────────────────────┐
│ John D. • Google • 2 days ago                              │
│ ┌──────────────────┐ ┌────────────┐ ┌───────────────────┐  │
│ │ Customer Confirmed│ │  Verified  │ │ Auto-Verified ✓  │  │
│ │     (amber)       │ │  (green)   │ │   (green)        │  │
│ └──────────────────┘ └────────────┘ └───────────────────┘  │
│                                                            │
│ "Great service! Highly recommend..."                       │
└────────────────────────────────────────────────────────────┘
```

### Badge Priority (if showing only one)

If space is limited, show highest trust level:
1. Auto-Verified (highest) - system proof
2. Verified (medium) - owner confirmed
3. Customer Confirmed (lowest) - self-reported

### Filter Enhancement

Expand the "Verified" filter dropdown:
- All
- Auto-Verified (system confirmed via GBP)
- Verified (manually marked)
- Customer Confirmed (self-reported)
- Unconfirmed (no confirmation of any type)

### Why This Matters

**Customer Confirmed ≠ Actually Posted**

A customer might say "Yes, I posted it" but:
- Google rejected it (spam filter, policy violation)
- They got distracted and never actually pasted
- They posted on wrong business profile

**Trust but verify**: Customer confirmation is a good signal, but system verification is proof.

### Database Query Examples

```sql
-- Reviews that customer confirmed but we haven't verified yet
SELECT * FROM review_submissions
WHERE customer_confirmed = 'confirmed'
  AND verified = false
  AND auto_verification_status != 'verified';

-- Reviews we should follow up on (customer had issues)
SELECT * FROM review_submissions
WHERE customer_confirmed = 'needs_help';

-- Fully verified reviews (either method)
SELECT * FROM review_submissions
WHERE verified = true OR auto_verification_status = 'verified';
```

---

## Open Questions

1. **Timing**: Show return state immediately after click, or wait for window focus?
   - **Decision**: Wait for tab return, then show immediately (no delay needed)

2. **Persistence**: How long to show return state?
   - Recommendation: Until user responds or 24 hours

3. **Multiple platforms**: Handle separately or together?
   - Recommendation: Separately (each platform gets its own return state)

4. **Email follow-up**: Send reminder if no response after X hours?
   - Future enhancement

---

## Next Steps

1. [ ] Review and approve this plan
2. [ ] Create database migration
3. [ ] Run `npx prisma db pull && npx prisma generate`
4. [ ] Create confirmation API endpoint
5. [ ] Build ReturnStateCard component
6. [ ] Integrate into page-client.tsx
7. [ ] Test end-to-end flow
8. [ ] Deploy to staging
