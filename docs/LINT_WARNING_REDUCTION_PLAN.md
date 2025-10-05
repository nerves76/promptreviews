# Lint Warning Reduction Plan

## Goal

Eliminate the backlog of `react-hooks/exhaustive-deps` warnings (and related lint noise) while preserving behaviour, so future lint runs fail fast on regressions.

## Current Snapshot

- `npm run lint` produces ~120 warnings, almost all `react-hooks/exhaustive-deps` across admin dashboards, auth contexts, and prompt-page flows.
- The new review-share OG image route is clean after adding alt text.

## Phase 1 – Baseline & Triage (1-2 days)

1. **Snapshot**: Capture `npm run lint` output to `lint-report.txt` so everyone works from the same inventory.
2. **Categorise warnings** by folder/feature:
   - Admin console (`src/app/(app)/admin/...`)
   - Auth contexts & guards (`src/auth/context`, `src/auth/guards`)
   - Prompt page editors (`src/app/(app)/prompt-pages`, `r/[slug]`, shared components)
   - Miscellaneous utilities (dynamic font loader, business info editor, etc.)
3. **Intent review**: For each category, decide whether omitted dependencies are intentional. If the omission is deliberate (e.g. stable ref), capture that in notes to guide code comments or structural changes.

## Phase 2 – Iterative Fixes

### Pass A: Low-Risk Targets (2-3 days)

- Pages/hooks without heavy side effects (standalone admin pages, helper hooks).
- Strategy: memoize loaders with `useCallback`, stabilise dependencies with refs, or move single-shot effects to explicit functions executed in handler callbacks.
- Deliverable: subset of files lint-clean, tests or manual spot-checks documented in PR notes.

### Pass B: Shared Contexts & Guards (3-4 days)

- Update `AccountContext`, `AdminContext`, `FeatureContext`, etc.
- Approach: convert `useEffect` loaders into custom hooks with explicit dependency arrays; ensure caching logic prevents infinite loops.
- Add regression coverage where missing (unit or integration tests around context providers).

### Pass C: Large Composite Views (1 week)

- `prompt-pages/page.tsx`, `r/[slug]/page-client.tsx`, `BusinessInfoEditor`, etc.
- Break large components into memoised subcomponents/hooks to reduce dependency churn.
- Validate manually (share flows, prompt page editing) after each chunk; consider Playwright/React Testing Library smoke tests if feasible.

## Phase 3 – Hardening & CI (2 days)

1. Confirm `npm run lint` returns zero warnings.
2. Add lint gate in CI (or a lint-staged step) that fails on new warnings.
3. Document patterns in `docs/linting.md` (e.g., when `useRef` or custom hooks are preferred).
4. Conduct knowledge share so future code stays warning-free.

## Multi-Agent Execution Strategy

To accelerate the cleanup, we can coordinate multiple AI assistants plus human oversight:

1. **Coordinator Agent**
   - Maintains the master lint inventory, assigns batches (e.g., “Admin dashboards”) to other agents.
   - Reviews diffs for consistency, ensures ESLint output stays tracked.

2. **Feature Agents**
   - Each agent focuses on one category at a time (Admin, Auth/Contexts, Prompt Pages).
   - Responsibilities:
     - Analyse existing code to understand side effects and dependency expectations.
     - Draft fixes (memoization, refactors, comments) with concise commit messages per batch.
     - Run targeted lint/tests; report back to coordinator.

3. **Regression Guard Agent**
   - Automates smoke testing (Playwright or scriptable flows) after each batch.
   - Flags suspicious behavioural changes for human review.

4. **You (human owner)**
   - Answer intent questions quickly (e.g., “Should `loadAnalytics` rerun on account switch?”).
   - Validate high-risk areas (auth flows, prompt page publish) after each pull request.
   - Merge batches and monitor production telemetry post-deploy.

### Communication Cadence

- Daily stand-up message summarising which warnings were cleared and remaining blockers.
- Shared tracker (Notion/Linear/GitHub Projects) listing batches, assigned agent, status, verification results.
- Post-merge checklist for each batch: lint zero in touched scope, manual test notes, any TODOs for follow-up.

### Tooling Suggestions

- Create a helper script (`scripts/lint-scope.js`) to run ESLint on a subset of folders, allowing agents to iterate faster.
- Add optional eslint-rule config for cases where behaviour depends on stable refs, alongside documented rationale.
- If we introduce automated tests, integrate them into CI to prevent regression (e.g., `npm run lint && npm run test --filter prompts`).

## Success Criteria

- `npm run lint` completes with zero warnings.
- No functional regressions in admin tools, auth flows, or prompt page editing/sharing.
- Team is aligned on patterns for future hook usage.
- CI enforces lint cleanliness so warning debt does not return.
