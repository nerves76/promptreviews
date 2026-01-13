# Agency Accounts

This document describes the Agency Accounts feature, which allows marketing agencies to manage multiple client workspaces with distinct billing relationships.

## Overview

Agency Accounts enable:
- **Multi-client management**: Agencies manage unlimited client workspaces from one dashboard
- **Flexible billing**: Agency can pay for clients or clients can pay themselves
- **Free workspace incentive**: Agency gets free workspace when they have 1+ paying clients
- **30-day trial**: New agencies get a trial period to onboard clients

## Database Schema

### Agency Fields on `accounts` Table

All agency-related fields use the `agncy_` prefix:

```sql
-- Agency identification
is_agncy BOOLEAN DEFAULT FALSE           -- Is this an agency account?
agncy_trial_start TIMESTAMPTZ            -- When agency trial started
agncy_trial_end TIMESTAMPTZ              -- When agency trial ends

-- Agency metadata (captured during signup/conversion)
agncy_type TEXT                          -- 'freelancer', 'small_agency', 'mid_agency', 'enterprise'
agncy_employee_count TEXT                -- '1', '2-5', '6-10', '11-50', '50+'
agncy_expected_clients TEXT              -- '1-5', '6-20', '21-50', '50+'
agncy_multi_location_pct TEXT            -- '0-25', '26-50', '51-75', '76-100'

-- Agency relationship (for client accounts)
managing_agncy_id UUID REFERENCES accounts(id)  -- Which agency manages this client
agncy_billing_owner TEXT DEFAULT 'client'       -- 'client' or 'agency'
```

### `agncy_client_access` Table

Tracks agency-client relationships and user access:

```sql
CREATE TABLE agncy_client_access (
  id UUID PRIMARY KEY,
  agency_account_id UUID NOT NULL,        -- The agency
  client_account_id UUID NOT NULL,        -- The client being managed
  user_id UUID NOT NULL,                  -- Agency user with access
  role TEXT NOT NULL DEFAULT 'manager',   -- 'manager' or 'billing_manager'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'removed'
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  removed_by UUID,

  UNIQUE(agency_account_id, client_account_id, user_id)
);
```

### Agency Roles in `account_users`

Agency users are added to client accounts with special roles that don't count toward `max_users`:

- `agency_manager`: Full product access, no billing, no team management
- `agency_billing_manager`: Same + billing access

These roles are excluded from user count like `support` role.

## API Routes

### Agency Account Management

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/agency-signup` | POST | Create new user + agency account (public) |
| `/api/agency/signup` | POST | Create agency account (authenticated) |
| `/api/agency/convert` | GET | Check conversion eligibility |
| `/api/agency/convert` | POST | Convert existing account to agency |
| `/api/agency/trial-status` | GET | Check agency trial status |

### Client Relationships

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/agency/clients` | GET | List all managed clients |
| `/api/agency/clients` | POST | Invite client to be managed |
| `/api/agency/clients/[clientId]` | GET | Get client details + metrics |
| `/api/agency/clients/[clientId]` | DELETE | Disconnect from client |
| `/api/agency/accept` | POST | Client accepts agency invitation |
| `/api/agency/remove` | POST | Client removes agency access |

### Billing

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/agency/billing/take-over` | POST | Agency takes over client billing |
| `/api/agency/billing/release` | POST | Agency releases billing to client |

### Metrics

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/agency/metrics` | GET | Rollup metrics across all clients |

## UI Pages

### Agency Signup (`/auth/agency-signup`)

```
/auth/agency-signup/page.tsx    # 5-step signup wizard for new agencies
```

Public page (no authentication required) that combines:
- User registration (name, email, password)
- Agency questionnaire (type, employees, clients, multi-location)

### Agency Dashboard (`/agency/*`)

```
/agency
├── layout.tsx              # Agency-specific layout with sidebar
├── page.tsx                # Dashboard home (metrics + client grid)
├── clients/
│   ├── page.tsx            # Client list with status filters
│   └── [clientId]/
│       └── page.tsx        # Client detail + billing actions
└── settings/
    └── page.tsx            # Agency settings + metadata
```

### Client-Side Settings

```
/dashboard/settings/agency-access/
├── page.tsx                # View/manage agency relationship
└── convert/
    └── page.tsx            # Convert to agency questionnaire
```

### Account Page Integration

The `/dashboard/account` page shows an "Agency" section that adapts based on account status:
- **Agency accounts**: Link to agency dashboard
- **Managed clients**: Link to agency access settings
- **Regular accounts**: "Convert to agency" option

## Billing Logic

### Key Files

```
/src/lib/billing/
├── agencyTrial.ts          # 30-day trial logic
├── agencyIncentive.ts      # Free workspace when 1+ paying clients
└── billingTransfer.ts      # Billing ownership transfer (TODO)
```

### Agency Trial Rules

1. Trial starts on agency signup/conversion
2. Trial lasts 30 days
3. Must have 1+ paying client OR pick own plan after trial
4. If trial expires without clients → must choose a plan

### Free Workspace Incentive

```typescript
// Check eligibility
const status = await checkAgencyFreeWorkspaceEligibility(supabase, agencyId);

// Sync after client subscription changes
const result = await syncAgencyFreeWorkspace(supabase, agencyId);
// result.action: 'activated' | 'deactivated' | 'unchanged'
```

Eligibility:
- Account must be an agency (`is_agncy = true`)
- Must have at least 1 paying client (active subscription, `agncy_billing_owner = 'agency'`)

### Billing Transfer Flow

**Agency takes over billing:**
1. Agency clicks "Take over billing" on client detail page
2. API creates subscription under agency's Stripe customer
3. Subscription metadata includes: `account_id`, `agency_account_id`, `billing_owner: 'agency'`
4. Client account updated: `agncy_billing_owner = 'agency'`

**Agency releases billing:**
1. Agency clicks "Release billing" on client detail page
2. Subscription canceled at period end
3. Client notified to add payment method
4. After period: client downgraded to free if no payment

**Client removes agency:**
1. Client clicks "Remove agency" in agency access settings
2. If agency was billing: subscription canceled, client downgraded
3. Agency users removed from client account

## Stripe Webhook Integration

The webhook (`/api/stripe-webhook/route.ts`) handles agency billing:

```typescript
// Detect agency-billed subscriptions
const agencyAccountId = subscription.metadata?.agency_account_id;
const billingOwner = subscription.metadata?.billing_owner;
const clientAccountId = subscription.metadata?.account_id;
const isAgencyBilledSubscription = agencyAccountId && billingOwner === 'agency';

if (isAgencyBilledSubscription && clientAccountId) {
  // Update client account (not agency's Stripe customer)
  await supabase.from('accounts').update({...}).eq('id', clientAccountId);

  // Sync agency free workspace incentive
  await syncAgencyFreeWorkspace(supabase, agencyAccountId);
}
```

For regular subscriptions, the webhook also checks if the account has a managing agency and syncs their free workspace:

```typescript
const agenciesToSync = await getAgenciesForClient(supabase, updatedAccountId);
for (const agencyId of agenciesToSync) {
  await syncAgencyFreeWorkspace(supabase, agencyId);
}
```

## Key Flows

### 1. Agency Signup Flow (New Users)

```
User → /auth/agency-signup → 5-step wizard:
  Step 1: Account details (name, email, password, terms)
  Step 2: Agency type
  Step 3: Employee count
  Step 4: Expected clients
  Step 5: Multi-location percentage
→ POST /api/auth/agency-signup
→ User + Agency account created with 30-day trial
→ Account marked with business_creation_complete=true (skips business setup)
→ Redirect to sign-in → sign-in detects agency → redirects to /agency dashboard
```

### 2. Convert Existing Account to Agency

```
User → /dashboard/settings/agency-access → "Convert to agency"
→ /dashboard/settings/agency-access/convert → 4-step questionnaire
→ POST /api/agency/convert → Account updated
→ Redirect to /agency dashboard
```

### 3. Agency Invites Client

```
Agency → /agency/clients → "Add client" → Enter email
→ POST /api/agency/clients → Invitation created
→ Client receives email → Clicks link
→ POST /api/agency/accept → Relationship activated
→ Agency users added to client account
```

### 4. Agency Takes Over Billing

```
Agency → /agency/clients/[id] → "Take over billing"
→ Confirm modal → POST /api/agency/billing/take-over
→ Stripe subscription created under agency customer
→ Client account updated: agncy_billing_owner='agency'
→ Agency free workspace synced
```

### 5. Client Removes Agency

```
Client → /dashboard/settings/agency-access → "Remove agency"
→ Warning about billing implications → Confirm
→ POST /api/agency/remove
→ If agency was billing: subscription canceled, downgrade scheduled
→ Agency users removed from client account
```

## Status Indicators

Client status shown in agency dashboard:

| Status | Meaning | Color |
|--------|---------|-------|
| `active` | Paid subscription active | Green |
| `trialing` | In trial period | Blue |
| `needs_billing` | No payment method | Amber |
| `pending` | Invitation sent, not accepted | Gray |
| `canceled` | Subscription canceled | Red |

## Auth Context Integration

The auth system includes agency fields:

```typescript
// In useAuth() hook
account: {
  id: string;
  is_agncy: boolean;              // Is this an agency?
  managing_agncy_id: string | null; // Agency managing this account
  // ...
}
```

### Account Selection

The `accountSelection.ts` utility fetches `is_agncy` when listing user accounts:

```typescript
const accounts = await fetchUserAccounts(userId);
// Each account includes: { account_id, role, is_agncy, ... }
```

## Security Considerations

### Account Isolation

All agency API routes use `getRequestAccountId()` to ensure proper account isolation:

```typescript
const agencyAccountId = await getRequestAccountId(request, user.id, supabase);
if (!agencyAccountId) {
  return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
}
```

### Permission Checks

- Agency operations verify `is_agncy = true`
- Billing operations verify user has `owner` role on agency
- Client operations verify `managing_agncy_id` matches

### Cross-Account Access

Agency users access client accounts via `account_users` with agency roles. These entries are created when:
1. Client accepts agency invitation
2. Agency user is granted access via `agncy_client_access`

## Testing Checklist

When testing agency features:

- [ ] Create new agency via signup
- [ ] Convert existing account to agency
- [ ] Invite client (new account)
- [ ] Invite existing account as client
- [ ] Client accepts invitation
- [ ] Client declines invitation
- [ ] Agency takes over billing
- [ ] Agency releases billing
- [ ] Client removes agency (with agency billing)
- [ ] Client removes agency (with own billing)
- [ ] Agency trial expiration
- [ ] Free workspace activation/deactivation
- [ ] Account switcher shows agency dashboard link
- [ ] Agency metrics aggregation

## Future Enhancements (Out of Scope)

These features are designed for but not implemented:

- Multi-client Kanban board
- Agency task library
- White-label reporting
- Bulk actions across clients
- Per-client feature toggles
- Agency-specific pricing plans
- Multiple agencies per client

## Related Files

### Database Migrations
- `supabase/migrations/[timestamp]_add_agncy_fields.sql`
- `supabase/migrations/[timestamp]_create_agncy_client_access.sql`
- `supabase/migrations/[timestamp]_add_agency_roles.sql`

### Core Libraries
- `/src/lib/billing/agencyTrial.ts`
- `/src/lib/billing/agencyIncentive.ts`

### API Routes
- `/src/app/(app)/api/agency/*`

### UI Components
- `/src/app/(app)/agency/*`
- `/src/app/(app)/dashboard/settings/agency-access/*`

### Auth Integration
- `/src/auth/utils/accountSelection.ts`
- `/src/auth/types/auth.types.ts`
