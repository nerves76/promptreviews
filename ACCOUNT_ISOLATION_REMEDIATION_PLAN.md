# Account Isolation Remediation Plan

## Overview

Recent auditing uncovered several multi-account isolation gaps that allow actions triggered under one account context to operate on another. The primary offenders are missing `X-Selected-Account` headers, continuing to key operations off `user.id`, and inconsistent enforcement of account-level limits. This document captures the key issues, and lays out a multi-agent remediation and verification plan designed to prevent regressions while work happens in parallel.

## Key Findings (from audit)

- **Account header omitted in client fetches:** Numerous client flows call APIs without `X-Selected-Account`, so the server falls back to the primary account (standard `getRequestAccountId` behaviour). Critical examples:
  - Business locations load/create (`src/app/(app)/prompt-pages/page.tsx:365`, `:383`)
  - Team members & invitations (`src/app/(app)/dashboard/team/page.tsx:205-223`)
  - Communications module (`src/app/(app)/components/communication/CommunicationButtons.tsx:83-130`)
  - Contacts bulk/merge/export operations (`src/app/(app)/dashboard/contacts/page.tsx:739-823`)
- **Prompt page creation uses `user.id`:** `CreatePromptPageClient` writes new pages against `account_id: user.id` even when an invited admin is working in another account (`src/app/(app)/create-prompt-page/CreatePromptPageClient.tsx:1114-1155`).
- **Plan/limit checks use the wrong identifier:** All `checkAccountLimits` callers pass `user.id` instead of the active account ID (e.g. `src/app/(app)/api/contacts/create/route.ts:67`, `dashboard/page.tsx:209`, `dashboard/contacts/page.tsx:69-103`, `create-prompt-page/CreatePromptPageClient.tsx:1114`).
- **Bulk contact prompt creation missing account context:** The client request body skips `account_id` while the API requires it for validation (`src/app/(app)/dashboard/contacts/page.tsx:739-749` versus `api/contacts/bulk-create-prompt-pages/route.ts:33-60`).

## Multi-Agent Remediation Strategy

### Agent Alpha – Header Standardisation
- **Scope:** Replace direct `fetch` calls for account-scoped APIs with `apiClient` (or a new thin wrapper) to ensure auth headers and `X-Selected-Account` are injected.
- **Target areas:** Business locations, team pages, communications module, contacts flows, and any other account-aware fetches discovered while refactoring.
- **Deliverables:**
  - Updated components/hooks using the shared client.
  - Unit tests (or integration tests) covering header injection for at least one key flow.
  - Updated developer docs describing when to use the wrapper.

### Agent Beta – Account ID Fixes in Data Mutations
- **Scope:** Ensure all data mutations (prompt page creation, contacts APIs, etc.) use the active `accountId` rather than `user.id`.
- **Tasks:**
  1. Fix `CreatePromptPageClient` to resolve `accountId` from context and propagate it to Supabase calls.
  2. Audit server endpoints for lingering `user.id` usage where `account_id` is expected.
  3. Update bulk contact operations to include `account_id` in requests.
- **Deliverables:**
  - Code changes with regression tests (Playwright/API-level) ensuring created entities land in the selected account.
  - Migration notes for any scripts or utilities impacted by the new parameter requirements.

### Agent Gamma – Limits & Guardrails
- **Scope:** Correct every call to `checkAccountLimits`, adding coverage to prevent regressions.
- **Tasks:**
  1. Update all invocations to pass the active account ID.
  2. Add safeguards to the helper to log/throw when given a `userId` (optional but recommended for early detection).
  3. Extend automated tests to cover free/paid account limit enforcement for multi-account users.
- **Deliverables:**
  - Refactored callers with targeted unit tests or mocks verifying account-scoped checks.
  - QA test script describing manual verification steps for limit enforcement.

### Agent Delta – QA & Verification Harness
- **Scope:** Build the safety net that catches regressions and confirms fixes.
- **Tasks:**
  1. Expand the existing account isolation Playwright suite to cover the new flows (business locations, team management, contacts bulk operations).
  2. Add API isolation tests (similar to `test-api-isolation-direct.js`) that assert proper header usage and account IDs in mutations.
  3. Define manual QA checklists covering a multi-account admin, ensuring all dashboard sections respect the switcher.
- **Deliverables:**
  - Updated automated test suite with CI hooks.
  - Shared QA checklist in docs/QA for manual verification rounds.

## Double-Check & Verification System

1. **Change Review Matrix**
   - Each agent owns a pull request, but another agent must review it for account-awareness issues.
   - Review checklist: header injection confirmed, account ID sourced from context, tests added/updated.

2. **Staggered Merges**
   - Merge sequence: Alpha → Beta → Gamma → Delta. Each merge triggers the full account isolation test suite.
   - If any suite step fails, freeze merges until the issue is resolved and re-tested.

3. **Verification Gates**
   - **Automated:** Jest/unit, API isolation scripts, Playwright flows (desktop + mobile viewport).
   - **Manual:** QA runs through account switching across Dashboard, Prompt Pages, Contacts, Team.
   - Record outcomes in `ACCOUNT_ISOLATION_TEST_RESULTS.md` with before/after screenshots where relevant.

4. **Post-Deployment Monitoring**
   - Enable targeted logging (short-term) on APIs involved, capturing mismatched `user.id` vs `account_id` to catch any remaining leaks.
   - Review Sentry or Supabase logs after release for 48 hours.

## Next Steps

1. Kick off Agent Alpha’s refactor with a shared checklist of target files.
2. Stand up a coordination channel (Slack thread or issue) to track progress and cross-agent blockers.
3. Schedule a mid-sprint review to confirm no new account bleed issues have appeared.
4. After all agents sign off, perform a final holistic QA run and archive results alongside this document.

