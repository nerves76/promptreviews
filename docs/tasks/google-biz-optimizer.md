# Google Biz Optimizer Task Board

This file acts as a lightweight ticket backlog for AI agents working on the Google Biz Optimizer embed. Update it in place instead of using external tooling.

## Usage
- Pick a task, set the `Owner` field to your handle, and move it to `In Progress`.
- When you finish, move the row to `Done`, note the branch/PR if applicable, and tick any linked checklist items.
- Add new work items by copying the template below.

### Task Template
```
| NEW-ID | Short objective | Key acceptance criteria separated by semicolons | Primary files or directories | Owner |
```
Rename `NEW-ID` to the next `GBO-#` value.

## Backlog
| ID | Objective | Acceptance Criteria | Files | Owner |
| --- | --- | --- | --- | --- |
| GBO-1 | Build signed session service for embed | JWT signed with EMBED_SESSION_SECRET; token hashes stored via SHA-256; rotating key version supported | src/lib/services/optimizerLeadService.ts; migrations; env docs | _unassigned_ |
| GBO-2 | Implement AES token encryption helpers | AES-256-GCM encrypt/decrypt utilities; key versioning; server-only guard; unit tests covering encrypt/decrypt | src/lib/crypto/googleTokenCipher.ts; tests | _unassigned_ |
| GBO-5 | Document API payloads | Add JSDoc to embed lead/session handlers; README link from help index | src/app/(embed)/api/embed/*; docs/help/google-biz-optimizer/HELP_ARTICLES_INDEX.md | _unassigned_ |
| GBO-6 | Ship help modal inside embed | Help bubbles trigger shared modal; content loads from docs site; analytics event emitted | src/components/embed/HelpModal.tsx; src/app/(embed)/google-business-optimizer/* | _unassigned_ |
| GBO-7 | Maintain public test embed page | Update `test-embed.html` to load new iframe; document QA steps in README | test-embed.html; docs/google-biz-optimizer/embed/README.md | _unassigned_ |
| GBO-8 | Strip in-app task links for embed | Remove CTA arrows/links; add explanatory copy; guard with embed feature flag | src/components/*Task*; src/app/(embed)/google-business-optimizer/* | _unassigned_ |

## In Progress
| ID | Objective | Acceptance Criteria | Files | Owner |
| --- | --- | --- | --- | --- |

## Done
| ID | Objective | Acceptance Criteria | Files | Owner |
| --- | --- | --- | --- | --- |
| GBO-3 | Wire embed resize + origin allowlist | ResizeObserver posts throttled resize messages; parent allowlist derived from ENV; host snippet updated | src/app/(embed)/embed/google-business-optimizer/page.tsx; src/app/(embed)/embed/google-business-optimizer/GoogleBusinessOptimizerEmbed.tsx; docs/google-biz-optimizer/embed/README.md; test-embed.html | Codex (local) |
| GBO-4 | Harden CSP and response headers | frame-ancestors matches allowlist; Permissions-Policy + X-Frame-Options set; regression test or lint | next.config.js; src/middleware.ts | Codex (local) |
| GBO-1 | Build signed session service for embed | JWT signed with EMBED_SESSION_SECRET; token hashes stored via SHA-256; rotating key version supported | src/lib/services/optimizerLeadService.ts; supabase/migrations/20250319090000_create_optimizer_embed_tables.sql; src/app/(embed)/api/embed/session/create/route.ts; .env*; docs/google-biz-optimizer/embed/README.md | Codex (local) |
