# Credit System Implementation Plan

## Overview
- Goal: ship a shared credit wallet that coexists with the current 3 tiers, with included monthly credits per tier, purchasable/top-up credit packs, and metered usage for geo grids, keyword tracking, keyword finder, and later AI review generation caps.
- Stripe model: one-time credit packs + optional monthly auto-topups; grant on `checkout.session.completed` and `invoice.payment_succeeded`; claw back on refunds/cancellations; idempotent via Session/Invoice IDs.
- Credit rules (initial): purchased credits never expire; monthly included credits expire monthly. Packs: $20→200, $60→700, $180→2,300. Included: Tier1 100, Tier2 400, Tier3 1,200. Geo grid cost = 10 base + 1 per cell (3×3=19, 5×5=35, 7×7=59, 9×9=91). Keyword tracking: daily 10, 3×/week 7, weekly 4 per keyword per month. Keyword finder: buckets by review volume (10/25/50). AI review gen: hard caps first; add credit cost later.

## Roles & Check-ins
- Product/PM (owner: TBD): finalize pricing, caps, rollout messaging; run acceptance.
- Backend (owner: TBD): Supabase schema, pricing rules loader, debit/refund flows, scheduled jobs, Stripe webhooks.
- Frontend (owner: TBD): balance display, cost estimates, purchase/top-up UI, feature gating when insufficient credits.
- Billing/Stripe (owner: TBD or shared with Backend): Stripe Products/Prices, webhook reliability, refund handling.
- QA (owner: TBD): test matrix coverage, webhook idempotency, RLS checks.
- Check-ins: daily async update; live review twice per week (mid-sprint and pre-ship). PR reviews required for backend, frontend, and webhook changes.

## Milestones
1) Foundations (schema + Stripe plumbing) — 3–4 days  
2) Feature integration (geo grid + keyword tracking) — 4–5 days  
3) UI/UX + launch readiness — 3–4 days

## Work Breakdown (with owners)
### Milestone 1: Foundations
- Backend: create tables `user_credit_balance`, `credit_ledger`, `credit_pricing_rules`, `credit_included_by_tier`; add RLS so users only see their own ledger.
- Backend: seed pricing rules with grid presets and keyword frequency rates; seed included-by-tier values.
- Billing/Stripe: create 3 one-time pack Prices and 3 monthly auto-topup Prices; store price IDs in config.
- Backend: webhook handler to grant credits on session/invoice success; claw back on refunds; idempotency via Session/Invoice IDs.
- Backend: monthly job to expire included credits and re-grant monthly allotment per tier; purchased credits untouched.

### Milestone 2: Feature Integration
- Backend: debit on enqueue with idempotency keys; refund on failure; metadata includes feature params (grid size/frequency/keyword IDs/job IDs).
- Backend: enforce per-tier caps (geo grid runs/day, keyword count) and insufficient-balance blocking.
- Frontend: show balance + estimated cost before run; block/disable actions when insufficient credits; surface cap errors.
- Backend: keyword tracking frequency options (daily/3×week/weekly) tied to pricing rules; apply cost per keyword per month.
- Backend: keyword finder buckets; debit per run based on review volume bucket.

### Milestone 3: UI/UX + Launch
- Frontend: purchase/top-up flow via Stripe Checkout; success/failure states; link to billing history if needed.
- Frontend: ledger view (recent charges, purchases, included credit grants); clear copy about expiration of included credits vs non-expiring purchased.
- Product: finalize copy for pricing page and in-app tooltips; add “estimated cost” messaging for geo grids and keyword frequency selector.
- QA: end-to-end tests for purchase → balance increase; feature runs → balance decrease; refund → balance decrease; insufficient balance flow; cap enforcement.
- Monitoring: alerts on webhook failures and spend spikes; logs include idempotency keys and user IDs.

## Technical Notes
- Debit strategy: debit on enqueue (simple); issue compensating refund ledger on failure with same metadata/idempotency to net to zero.
- Pricing changes: load from `credit_pricing_rules` by `feature_type` and `active_from`; allows updates without redeploy.
- Idempotency: store `idempotency_key` UNIQUE on ledger for feature charges; Session/Invoice IDs for grants; avoids double debits on retries.
- Admin: manual adjustments via ledger `manual_adjust`; per-user cap overrides stored alongside caps table/config.
- Pin spacing (geo grid): expose as optional UI control; pricing stays tied to grid size only.

## Deliverables & Reviews
- M1 review: tables seeded, webhooks deployed to staging, monthly job scheduled; test script showing grant and claw-back idempotency.
- M2 review: geo grid + keyword tracking flows debit correctly in staging; caps enforced; UI blocks on insufficient balance.
- M3 review: Checkout flow live in staging; ledger/balance UI complete; monitoring and alerts configured; QA sign-off checklist passed.

## Risks & Mitigations
- Double charges on retries: mitigate with ledger `idempotency_key` uniqueness and Stripe event replay safety.
- Webhook delivery failures: Stripe retry + alerting; dead-letter queue/log for manual replay.
- Pricing misconfig: versioned pricing rules; staging verification before prod; feature flags for rollout.
- User confusion on expiration: clear copy and badges differentiating included vs purchased credits.
