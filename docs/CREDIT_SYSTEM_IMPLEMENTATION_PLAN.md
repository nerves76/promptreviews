# Credit System Implementation Plan

## Status: ✅ IMPLEMENTED (December 2024)

All milestones complete. Credit system is live with geo-grid integration.

## Overview
- Goal: ship a shared credit wallet per **account** that coexists with the current 3 tiers, with included monthly credits per tier, purchasable/top-up credit packs, and metered usage for geo grids (Phase 1), with keyword tracking, keyword finder, and AI review generation caps added later.
- Stripe model: one-time credit packs + optional monthly auto-topups; grant on `checkout.session.completed` and `invoice.payment_succeeded`; claw back on refunds/cancellations; idempotent via Session/Invoice IDs.
- **FINAL Credit rules**: purchased credits never expire; monthly included credits expire monthly. Packs: $20→200, $60→700, $180→2,300. **Included: free 0, grower 100, builder 200, maven 400**. Free accounts get 0 included credits and must purchase packs to use credit-based features.
- **FINAL Geo grid cost formula**: `10 base + 1 per cell + 2 per keyword` (ensures 50%+ margin even at extreme usage).
- **Review matching cost**: 1 credit per check (flat rate) - scans all reviews for keyword/alias matches.
- Future features (not in initial release): Keyword tracking (daily 10, 3×/week 7, weekly 4 per keyword per month), Keyword finder (buckets 10/25/50), AI review gen (hard caps first, credit cost later).
- Rollout: Hard cutover - credits required immediately, no migration/grandfather period (small user base).

## Roles & Check-ins
- Product/PM (owner: TBD): finalize pricing, caps, rollout messaging; run acceptance.
- Backend (owner: TBD): Supabase schema, pricing rules loader, debit/refund flows, scheduled jobs, Stripe webhooks.
- Frontend (owner: TBD): balance display, cost estimates, purchase/top-up UI, feature gating when insufficient credits.
- Billing/Stripe (owner: TBD or shared with Backend): Stripe Products/Prices, webhook reliability, refund handling.
- QA (owner: TBD): test matrix coverage, webhook idempotency, RLS checks.
- Check-ins: daily async update; live review twice per week (mid-sprint and pre-ship). PR reviews required for backend, frontend, and webhook changes.

## Milestones
1) Foundations (schema + Stripe plumbing + credit service)
2) Feature integration (geo grid only - debit/refund flow)
3) UI/UX + launch readiness (credits page, nav badge, geo grid UI)

## Work Breakdown (with owners)
### Milestone 1: Foundations
- Backend: create tables `credit_balances` (account-based), `credit_ledger`, `credit_pricing_rules`, `credit_included_by_tier`; add RLS so accounts only see their own ledger.
- Backend: seed pricing rules with grid presets; seed included-by-tier values (free: 0, grower: 100, builder: 200, maven: 400).
- Billing/Stripe: create 3 one-time pack Prices and 3 monthly auto-topup Prices in Stripe Dashboard; store price IDs in env config.
- Backend: extend existing webhook handler to grant credits on session/invoice success for credit packs; claw back on refunds; idempotency via Session/Invoice IDs.
- Backend: monthly cron job to expire included credits and re-grant monthly allotment per tier; purchased credits untouched; free accounts get 0.

#### Stripe Product Setup Guide (Manual Steps)
1. Go to Stripe Dashboard → Products → Create Product
2. Create product "Credit Pack - 200 Credits":
   - Price: $20.00 USD, one-time
   - Add metadata: `credits: 200`, `pack_type: one_time`
   - Note the Price ID (e.g., `price_xxx`)
3. Create product "Credit Pack - 700 Credits":
   - Price: $60.00 USD, one-time
   - Add metadata: `credits: 700`, `pack_type: one_time`
4. Create product "Credit Pack - 2300 Credits":
   - Price: $180.00 USD, one-time
   - Add metadata: `credits: 2300`, `pack_type: one_time`
5. (Optional) Create monthly auto-topup variants:
   - Same products but with recurring monthly pricing
   - Add metadata: `pack_type: auto_topup`
6. Add Price IDs to `.env`:
   ```
   STRIPE_CREDIT_PACK_200_PRICE_ID=price_xxx
   STRIPE_CREDIT_PACK_700_PRICE_ID=price_xxx
   STRIPE_CREDIT_PACK_2300_PRICE_ID=price_xxx
   ```

### Milestone 2: Feature Integration (Geo Grid Only)
- Backend: integrate credit debit into `/api/geo-grid/check` endpoint:
  - Calculate cost: `10 base + 1 per cell + 2 per keyword` (e.g., 5×5 with 5 keywords = 10+25+10 = 45 credits)
  - Check balance before run; return 402 Payment Required if insufficient
  - Debit on enqueue with idempotency key (`geo_grid:<check_id>`)
  - Issue compensating refund ledger entry on failure
- Backend: create credit service module (`/src/lib/credits/`) with:
  - `getBalance(accountId)` - returns { included, purchased, totalCredits }
  - `debit(accountId, amount, metadata, idempotencyKey)` - deducts credits (included first, then purchased)
  - `credit(accountId, amount, type, metadata, idempotencyKey)` - adds credits
  - `calculateGeogridCost(gridSize, keywordCount)` - returns credit cost for grid check
- Frontend: show balance + estimated cost on geo grid page before run; disable "Run Check" button when insufficient credits; show clear error message with link to purchase.
- Future (not this milestone): keyword tracking, keyword finder, AI review gen integration.

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

## Implementation Checklist (✅ All Complete)
- [x] Schema: create tables `credit_balances`, `credit_ledger`, `credit_pricing_rules`, `credit_included_by_tier`; add RLS so accounts see only their own rows; indexes on `account_id`, `idempotency_key`, and `created_at`.
- [x] Seeds: insert pricing rules JSON (geo grid: 10 base + 1/cell + 2/keyword), included-by-tier (free: 0, grower: 100, builder: 200, maven: 400), and pack mappings (price ID → credits).
- [x] Stripe: create Products/Prices for three one-time packs (200/$20, 700/$60, 2300/$180); store price IDs in DB; auto-topup variants created.
- [x] Webhooks: extend existing handler for `checkout.session.completed` to detect credit pack purchases (via metadata); grant credits with idempotency by Session ID; handle `charge.refunded` to claw back; handle `invoice.payment_succeeded` for subscription renewals.
- [x] Credit service (`/src/lib/credits/`): getBalance, debit, credit, calculateGeogridCost functions; debit uses included credits first, then purchased; idempotency via ledger unique constraint.
- [x] Geo grid integration: update `/api/geo-grid/check` to check balance → debit → run → refund on failure; return 402 if insufficient.
- [x] Jobs: monthly cron to expire included credits and re-grant per tier (skip free accounts); runs on last day of month.
- [x] Frontend Credits page: `/dashboard/credits` with balance display, ledger view, pack purchase flow, one-time/monthly toggle.
- [x] Frontend nav: add Credits to header with balance badge (warning color < 50, error color = 0).
- [x] Frontend geo grid: show cost estimate and balance; disable run when insufficient; link to purchase.
- [x] Prisma: run `npx prisma db pull && npx prisma generate` after migrations.

## Naming and Scalability Notes
- Naming: use `credit_` prefix for all ledger/balance/pricing objects; idempotency keys labeled by feature (e.g., `geo_grid:<job_id>`, `keyword_tracking:<freq>:<keyword_id>`, `review_matching:<account_id>:<keyword_id>:<check_id>`); config tables use explicit `feature_type` values (`geo_grid`, `keyword_tracking`, `keyword_finder`, `ai_review_gen`, `review_matching`, `concept_schedule`).
- Scalability: ledger immutable with indexed queries; pricing rules versioned to avoid code deploys; idempotent webhooks to survive retries; caps configurable per tier/user; supports new features by adding pricing rules + debiting metadata without schema changes.
- Documentation: every deployed function/webhook has a short README snippet (purpose, inputs, outputs, idempotency key) and a runbook entry for replay/adjustment paths.

## Credits UI/UX
- Credits page: **new top-level nav item** at route `/dashboard/credits` showing:
  - Current balance with split of included vs purchased credits
  - Renewal date for included credits (or "No monthly credits" for free accounts)
  - Recent ledger entries (last 20)
  - "Buy Credits" CTA that opens pack selector
  - Clear copy: "Included credits reset monthly. Purchased credits never expire."
- Nav integration:
  - Add "Credits" to main dashboard sidebar navigation
  - Show balance badge in nav (e.g., "Credits: 342")
  - Badge turns warning color when balance < 50, error color when balance = 0
- Packs selector modal/page:
  - 200 credits ($20) / 700 credits ($60) / 2,300 credits ($180)
  - Toggle for one-time vs monthly auto-topup
  - Opens Stripe Checkout on selection
- Post-Checkout: after redirect back, refresh balance (poll until webhook processed); handle failures with retry link.
- Geo grid integration:
  - Show estimated cost before running check (e.g., "This check will use 35 credits")
  - Show current balance inline
  - Disable "Run Check" when insufficient; show "Add Credits" button instead
- Ledger view: paginated entries with reason, feature metadata, credit delta; filter by feature type (geo_grid, purchase, monthly_grant, etc.).
