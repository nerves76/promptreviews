# Docs & Help Content Platform (AI Agent Plan)

## Context
- Next.js 14 App Router docs site with ~54 hardcoded TSX pages, centralized `faqData.ts`, fixed `Sidebar.tsx`, and a shared `StandardOverviewLayout`.
- Docs deploy to a separate Vercel instance so content can live on the main domain while the core app runs elsewhere.
- Help drawer inside the app consumes the same articles: contextual surfacing by current route, deep links from the UI, and featured articles per screen.
- MDX tooling exists but is unused; only the human admin can modify content today via code commits and deployments.

## Problem Statement
- Content tightly coupled to code causes high developer load, slow updates, and no revision history.
- Help drawer and docs site must stay in sync, but the current manual workflow risks divergence and broken deep links.
- Non-technical contributors cannot ship updates; every change requires a full build and deploy.

## Goals & Success Metrics
- Enable non-developers to edit docs/help content through an admin experience with preview and audit trails.
- Serve all docs and help content dynamically from Supabase while keeping anchor links and featured article logic intact.
- Reduce publish cycle to <5 minutes end-to-end; guarantee 100% parity of contextual help triggers during cutover.
- Provide revision history, draft/publish workflow, and telemetry on content fetch reliability (≤300 ms P95).

## Constraints & Assumptions
- Supabase remains the single data source; leverage existing project, auth, and RLS infrastructure.
- Help drawer must operate even if docs site deploys separately; both surfaces pull from the same APIs.
- Only one trusted human admin today; the system must support later delegation but cannot assume additional reviewers yet.
- No dedicated "app team"—all tasks must be automated or orchestrated by AI agents under human supervision.

## Agent Roster & Mandates

### Strategist Agent
- Owns charter, OKRs, timeline, and dependency tracking.
- Issues coordination prompts ("workshops"), resolves conflicts, and publishes weekly status summaries.
- Approves phase transitions once acceptance criteria are met.

### Information Architect Agent
- Maps existing TSX pages, FAQ entries, sidebar structure, and help drawer triggers to the target schema.
- Designs the canonical content model: `articles`, `faqs`, `navigation`, `contexts`, revision metadata, permissions.
- Authors content standards (slug conventions, markdown/MDX usage, anchor naming, featured article tagging).

### Data Engineer Agent
- Implements Supabase migrations, RLS policies, revision history tables/triggers, and seed data.
- Builds TSX → Markdown/JSON extraction pipelines with diff reports and error surfacing.
- Maintains migration CLI/scripts, staged datasets, and backup/rollback procedures.

### Platform Agent
- Delivers shared server utilities (Supabase client, server actions/APIs) powering both docs site and help drawer.
- Configures caching/ISR strategy, preview mode, and Supabase → Vercel revalidation hooks.
- Ensures resilience: health checks, logging, and fallback when cache invalidation fails.

### Docs Frontend Agent
- Refactors Next.js docs routes/layout to fetch dynamic content, render markdown/MDX, and preserve anchor stability.
- Replaces hardcoded sidebar with dynamic navigation aware of contextual metadata.
- Implements loading/error states, preview mode indicators, and accessibility regression tests.

### App Help Agent
- Re-tools in-app help drawer to query the new content service using route/feature context.
- Maintains deep-link compatibility (`/help?article=slug#anchor`), handles drafts/not-found gracefully, and adds local caching if Supabase is unreachable.
- Instruments telemetry for fetch latency, error rates, and click-through metrics.

### Admin UI Agent
- Extends the existing ADMIN area with CRUD interfaces for articles, FAQs, navigation, and context tagging.
- Adds markdown editor with live dual preview (docs page & help drawer layouts), scheduling, and draft → publish workflow.
- Surfaces audit log, revision compare, and role-based access controls for future editors.

### QA & Release Agent
- Defines testing matrix (unit, integration, Playwright flows for docs + help drawer).
- Automates parity checks between legacy TSX content and Supabase-rendered output (anchor diffing, featured article coverage).
- Coordinates staged rollout, telemetry dashboard, incident response, and rollback scripts to reinstate static content if needed.

## Phase Plan & Deliverables

### Phase 0 – Discovery & Charter (Strategist + Information Architect)
- Inventory current docs/help assets, contextual triggers, deployment topology.
- Produce project charter, glossary, metadata requirements, and risk register.
- Exit criteria: charter signed-off, schema requirements frozen, success metrics confirmed.

### Phase 1 – Schema & Migration Toolkit (Information Architect + Data Engineer)
- Finalize Supabase schema (`articles`, `faqs`, `navigation`, `context_bindings`, revision/audit tables) and RLS policies.
- Build extraction pipeline converting TSX/FAQ data to markdown + JSON metadata; capture diff reports with failure logs.
- Run pilot migration on 2–3 help-critical pages; deliver parity analysis and remediation list.
- Exit criteria: migrations repeatable, pilot pages validated, tooling documented.

### Phase 2 – Platform Foundation (Data Engineer + Platform)
- Ship server utilities and API endpoints for docs/help consumption with caching/ISR + preview support.
- Configure Supabase change webhooks to trigger Vercel revalidation and help drawer cache busting.
- Implement draft/publish splitting (e.g., `status` column + row-level filters) and audit logging.
- Exit criteria: staging environment serves migrated content with acceptable latency; revalidation verified.

### Phase 3 – Frontend Refactor (Docs Frontend + App Help)
- Replace hardcoded docs routes/sidebar with dynamic data, enabling MDX blocks/components.
- Update help drawer integration to query by route/context; add graceful fallbacks and telemetry events.
- Validate anchor stability, contextual featured articles, and preview mode behavior.
- Exit criteria: staging docs + help drawer achieve feature parity and pass regression suite.

### Phase 4 – Admin Experience (Admin UI)
- Introduce docs/help editor within ADMIN: list views, filters, markdown editor, navigation tree manager, FAQ ordering, context tagging.
- Integrate revision history viewer, publish workflow, draft preview links, and Supabase role enforcement.
- Provide onboarding guide and tutorial flow for non-technical editors.
- Exit criteria: admin can create/edit/publish content end-to-end without code changes; audit trail persists.

### Phase 5 – Validation & Rollout (QA & Release + Strategist)
- Execute automated/manual regression: docs routes, help drawer triggers, deep links, preview -> publish transitions.
- Run beta toggle enabling new system for internal routes first; monitor latency/error dashboards.
- Prepare rollback plan (toggle back to static content, restore previous deployment, revert Supabase tables if critical).
- Exit criteria: success metrics met, stakeholders sign-off, documentation updated, incident response playbook ready.

## Collaboration Rituals for AI Agents
- **Coordination Windows (“Workshops”)**: Strategist issues a directive prompt describing objective, scope, deadline, and expected responders. Agents asynchronously submit structured findings (Markdown/JSON). Strategist (or delegated lead) synthesizes results, resolves open points, and publishes a decision brief.
- **Daily Async Standup**: Each agent posts progress, blockers, next steps to the shared board; Strategist aggregates into status note.
- **Design Reviews**: Before major schema or API changes, Information Architect/Platform host review cycle by circulating proposal doc and collecting line-item feedback within a fixed response window.
- **Task Board**: Centralized Kanban with agent ownership, phase tag, dependencies, acceptance criteria, and automated alerts when migration diffs fail.

## Technical Implementation Notes
- **Content Model**: `articles` store markdown/MDX body, metadata (slug, title, category, keywords, contexts[], featured flags, published/draft timestamps). `faqs` hold structured Q/A with plan filters. `navigation` supports hierarchical ordering, icons, and visibility flags for docs vs help. `context_bindings` map app routes/features to article IDs/weights.
- **Revision History**: Use Supabase row-level version table or triggers writing to `article_revisions` capturing diff, editor, timestamp. Provide soft-deletes and restore workflow.
- **Fetching Layer**: Server actions wrap Supabase queries with caching (Next.js `revalidateTag`) and fallback to stale content if fresh fetch fails. Preview mode bypasses caching for drafts.
- **Help Drawer API**: Endpoint accepts `{ route, featureFlags }` and responds with prioritized article list plus fallback slug, supporting offline cache preloading.
- **Revalidation**: Supabase trigger posts to Vercel webhook and internal API for help drawer cache flush. Include exponential backoff + alerting on failures.

## Migration Strategy
- Categorize legacy content: high-impact help articles first, then remaining docs pages, followed by FAQs/navigation.
- Automated extraction parses TSX files, preserving headings (H1–H3) to generate deterministic anchor IDs; manual review handles custom components.
- After each migration batch, run parity diff (rendered HTML comparison, anchor map, featured article coverage) and store report in repo.
- Maintain rollback snapshot of legacy TSX content until phase 5 completes.

## Admin Experience Requirements
- Markdown editor with component shortcodes (callouts, videos, tabs) and contextual metadata forms (categories, contexts, featured flags).
- Dual preview panes: full-page docs view and help drawer view to verify anchor placement and truncation.
- Draft workflow: create/edit in draft, request review (optional), publish commits to live tables, with audit log entry per action.
- Access control: restrict editing to admin role now, but architecture supports future roles by mapping Supabase auth claims.

## Testing & Observability
- Unit tests for schema utilities, markdown parser, anchor generator, feature selectors.
- Integration tests verifying dynamic routes render expected content and `Sidebar` loads navigation tree.
- Playwright flows: open key app routes, trigger help drawer, validate featured articles, follow deep links.
- Monitoring: Supabase logs, Vercel request metrics, custom events for help drawer interactions, alerting on latency/error thresholds.

## Risks & Mitigations
- **Migration fidelity gaps**: Mitigate with diff tooling, manual QA gate, and staged rollout.
- **Cache invalidation failures**: Provide manual revalidation command, dual webhooks, and fallback stale content.
- **Single admin bottleneck**: Automate previews, document runbooks, and stage-ready to add reviewers quickly.
- **Supabase downtime**: Cache critical help content locally with TTL, expose status banner on docs/help surfaces.

## Immediate Next Actions
1. Strategist publishes charter template, success metrics draft, and coordination window schedule.
2. Data Engineer provisions Supabase staging schema and scaffolds migration CLI against two representative help articles.
3. Information Architect compiles current help drawer → article mapping and documents context metadata requirements.

