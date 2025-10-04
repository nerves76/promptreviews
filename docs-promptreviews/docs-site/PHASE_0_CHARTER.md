# Phase 0: Project Charter - Docs Content CMS Migration

**Project Name:** Docs & Help Content Platform Migration
**Charter Date:** 2025-10-03
**Project Lead:** Chris (Human Admin)
**Agent Coordinator:** AI Assistant (Multi-role)

---

## 1. Project Vision

Transform PromptReviews documentation from a code-coupled static site into a **dynamic, database-driven content management system** that empowers non-technical contributors to publish, edit, and manage help content without deployments.

---

## 2. Problem Statement

**Current Pain Points:**
1. Every content update requires developer intervention (code commit + build + deploy)
2. Help modal scrapes HTML from docs site - fragile and slow
3. No revision history or draft workflow
4. Content duplicated across multiple files (FAQ data, article IDs, nav structure)
5. Non-technical stakeholders cannot contribute
6. Publish cycle: 10-30 minutes (vs goal of <5 minutes)

**Business Impact:**
- Slow response to customer questions
- Outdated documentation creates support burden
- Marketing/support teams blocked by development bottleneck

---

## 3. Success Criteria

### Functional Requirements

| Requirement | Acceptance Criteria |
|-------------|---------------------|
| **Dynamic Content** | All 54 docs pages served from Supabase, not hardcoded TSX |
| **Admin UI** | Non-developer can create/edit/publish article in <5 minutes |
| **Revision History** | Every edit tracked with diff, author, timestamp |
| **Draft Workflow** | Draft → Preview → Publish with status tracking |
| **Context Preservation** | 100% parity of help modal context triggers |
| **Performance** | P95 latency ≤300ms for article fetch |
| **Anchor Stability** | All existing anchor links preserved |

### Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Availability** | 99.9% uptime (Supabase SLA) |
| **Caching** | ISR with 5-minute revalidation |
| **Rollback** | Restore previous version in <2 minutes |
| **Search** | Full-text search across all content |
| **Media** | Support images, videos, attachments |

---

## 4. Scope

### In Scope

**Phase 1: Schema & Migration**
- ✅ Design Supabase schema (articles, FAQs, navigation, contexts, revisions)
- ✅ Build TSX → Markdown extraction pipeline
- ✅ Migrate 13 high-priority articles
- ✅ Migrate navigation structure
- ✅ Migrate context mappings

**Phase 2: Platform Foundation**
- ✅ Server utilities & APIs
- ✅ Caching/ISR strategy
- ✅ Preview mode
- ✅ Revalidation webhooks

**Phase 3: Frontend Refactor**
- ✅ Dynamic docs routes
- ✅ Help modal integration
- ✅ Anchor stability testing

**Phase 4: Admin UI**
- ✅ CRUD interfaces
- ✅ Markdown editor with preview
- ✅ Draft/publish workflow
- ✅ Revision history viewer

**Phase 5: Rollout**
- ✅ Automated testing
- ✅ Staged deployment
- ✅ Monitoring & alerts

### Out of Scope

- ❌ Migrating old blog posts (if any)
- ❌ User-generated content (comments, etc.)
- ❌ Multi-language support (i18n)
- ❌ Video hosting (use external: YouTube, Vimeo)
- ❌ AI content generation (future enhancement)

---

## 5. Stakeholders

| Role | Name | Responsibilities |
|------|------|------------------|
| **Project Owner** | Chris | Final approval, charter sign-off |
| **AI Agent** | Claude | Multi-role execution (architect, engineer, QA) |
| **End Users** | Support/Marketing teams | Content editors (post-launch) |
| **Customers** | PromptReviews users | Consume help content |

---

## 6. Technical Approach

### Architecture Decision: Supabase as CMS

**Rationale:**
- ✅ Already in tech stack (no new dependencies)
- ✅ Postgres with JSONB for flexible metadata
- ✅ Row-level security (RLS) for permissions
- ✅ Real-time subscriptions for cache invalidation
- ✅ Free tier sufficient for docs content

**Alternative Considered:**
- File-based CMS (Tina, Keystatic) - Rejected: no live preview, git dependency
- Headless CMS (Contentful, Sanity) - Rejected: additional cost, vendor lock-in

### Content Storage Strategy

**Markdown + JSON Metadata**
- Article body: Markdown (portable, diffable)
- Rich metadata: JSONB (flexible schema)
- Custom components: MDX or JSON config

**Benefits:**
- Easy migration from TSX
- Version control friendly
- Portable across platforms

---

## 7. Data Model (High-Level)

### Core Tables

```sql
-- Articles
articles (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,  -- Markdown/MDX
  metadata jsonb,  -- { description, keywords, icons, etc. }
  status text DEFAULT 'draft',  -- draft | published | archived
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
)

-- FAQs
faqs (
  id uuid PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL,
  plans text[],  -- ['grower', 'builder', 'maven']
  order_index int DEFAULT 0,
  article_id uuid REFERENCES articles(id),  -- Optional: link to article
  created_at timestamptz DEFAULT now()
)

-- Navigation
navigation (
  id uuid PRIMARY KEY,
  parent_id uuid REFERENCES navigation(id),
  title text NOT NULL,
  href text,
  icon_name text,  -- Lucide icon as string
  order_index int DEFAULT 0,
  visibility text[] DEFAULT ARRAY['docs', 'help'],  -- Where it appears
  created_at timestamptz DEFAULT now()
)

-- Article Context Bindings
article_contexts (
  id uuid PRIMARY KEY,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  route_pattern text NOT NULL,  -- '/dashboard/prompt-pages'
  keywords text[],
  priority int DEFAULT 50,  -- 0-100, higher = more relevant
  created_at timestamptz DEFAULT now()
)

-- Revision History
article_revisions (
  id uuid PRIMARY KEY,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  content text NOT NULL,
  metadata jsonb,
  editor_id uuid REFERENCES auth.users(id),
  change_summary text,
  created_at timestamptz DEFAULT now()
)

-- Media Assets (optional - Phase 2+)
media_assets (
  id uuid PRIMARY KEY,
  filename text NOT NULL,
  url text NOT NULL,
  mime_type text,
  size_bytes int,
  alt_text text,
  article_id uuid REFERENCES articles(id),
  created_at timestamptz DEFAULT now()
)
```

### Indexes

```sql
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_article_id ON faqs(article_id);
CREATE INDEX idx_navigation_parent_id ON navigation(parent_id);
CREATE INDEX idx_navigation_order ON navigation(order_index);
CREATE INDEX idx_article_contexts_route ON article_contexts(route_pattern);
CREATE INDEX idx_article_revisions_article_id ON article_revisions(article_id);
CREATE INDEX idx_article_revisions_created_at ON article_revisions(created_at DESC);

-- Full-text search
CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('english', title || ' ' || content));
```

### RLS Policies

```sql
-- Public read for published articles
CREATE POLICY "Public read published articles"
  ON articles FOR SELECT
  USING (status = 'published');

-- Admins can do anything
CREATE POLICY "Admins full access"
  ON articles FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM account_users
      WHERE role = 'admin'
    )
  );

-- Similar policies for faqs, navigation, etc.
```

---

## 8. Content Standards

### Slug Conventions

- **Format:** `kebab-case`
- **Examples:**
  - `getting-started`
  - `prompt-pages/types/service`
  - `strategies/double-dip`
- **Rules:**
  - Must be unique globally
  - No special characters except `-` and `/`
  - Stable across renames (use aliases table)

### Markdown/MDX Usage

**Supported Markdown:**
- Headings (H1-H6) - Auto-generate anchor IDs
- Lists (ordered, unordered)
- Code blocks with syntax highlighting
- Blockquotes
- Tables
- Images `![alt](url)`
- Links `[text](url)`

**MDX Components (custom):**
```markdown
<Callout type="info|warning|success">
  Content here
</Callout>

<VideoEmbed url="..." />

<Tabs>
  <Tab label="Tab 1">Content</Tab>
  <Tab label="Tab 2">Content</Tab>
</Tabs>

<PlanBadge plans={['builder', 'maven']} />
```

### Anchor Naming

**Auto-generated from headings:**
```markdown
## How It Works  →  #how-it-works
### Setting Up  →  #setting-up
```

**Rules:**
- Lowercase
- Replace spaces with `-`
- Remove special characters
- Ensure uniqueness per article

### Metadata Schema

```typescript
interface ArticleMetadata {
  // SEO
  description: string
  keywords: string[]
  canonical_url?: string
  og_image?: string

  // Organization
  category: string  // 'getting-started' | 'prompt-pages' | etc.
  tags: string[]

  // Display
  category_label: string  // "Quick Start Guide"
  category_icon: string   // Lucide icon name
  category_color: 'green' | 'blue' | 'purple' | etc.

  // Access Control
  available_plans: ('grower' | 'builder' | 'maven' | 'enterprise')[]

  // Featured Content
  featured_topics?: string[]
  key_features?: {
    icon: string
    title: string
    description: string
  }[]
  how_it_works?: {
    number: number
    title: string
    description: string
    icon: string
  }[]
  best_practices?: {
    icon: string
    title: string
    description: string
  }[]

  // Call to Action
  cta_primary?: { text: string, href: string, external?: boolean }
  cta_secondary?: { text: string, href: string }
}
```

---

## 9. Migration Strategy

### Content Prioritization

**Batch 1: Critical Help Articles (Phase 1)**
1. Getting Started (1 page)
2. Create Prompt Page (1 page)
3. **Total:** 2 articles for pilot

**Batch 2: Core Dashboard Features (Phase 1)**
4-13. Remaining getting-started, prompt pages, widgets, contacts, google business
**Total:** 11 articles

**Batch 3: Strategies & Advanced (Phase 2)**
14-33. Strategies, analytics, API docs
**Total:** 20 articles

**Batch 4: Support & Settings (Phase 2)**
34-54. FAQ, troubleshooting, billing, team
**Total:** 21 articles

**Batch 5: FAQs (Phase 3)**
All 85+ FAQ entries

**Batch 6: Navigation (Phase 3)**
Sidebar structure (10 top-level, 40 children)

### Extraction Pipeline

**Step 1: Parse TSX**
- Extract metadata from `export const metadata`
- Extract component props (`keyFeatures`, `howItWorks`, etc.)
- Extract text content from JSX

**Step 2: Convert to Markdown**
- Headings remain headings
- Lists remain lists
- Code blocks preserved
- Icons → icon name strings

**Step 3: Generate Metadata JSON**
- Combine metadata + component props
- Store in `articles.metadata` JSONB column

**Step 4: Validation**
- Render markdown → HTML
- Diff against current page HTML
- Flag anchor mismatches
- Store report

**Step 5: Manual Review**
- QA specialist reviews diff report
- Fixes custom component conversions
- Approves migration

---

## 10. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| **Content fidelity loss** | Medium | High | Automated diff reports + manual QA |
| **Anchor link breakage** | Low | High | Deterministic ID generation + testing |
| **Help modal breaks** | Low | Critical | Feature flag + graceful fallback |
| **Cache invalidation fails** | Medium | Medium | Manual revalidation API + monitoring |
| **Supabase downtime** | Low | High | Stale content cache + status banner |
| **Schema changes needed** | High | Low | Agile schema evolution with migrations |
| **Non-technical users struggle** | Medium | Medium | Training docs + onboarding tutorial |

---

## 11. Timeline & Milestones

| Phase | Duration | Deliverables | Exit Criteria |
|-------|----------|--------------|---------------|
| **Phase 0** | 1 day | Inventory, Charter | ✅ Charter approved |
| **Phase 1** | 3-5 days | Schema, migration toolkit, pilot (2 articles) | Schema deployed, 2 articles migrated with 100% parity |
| **Phase 2** | 3-4 days | APIs, caching, revalidation | Staging serves dynamic content <300ms P95 |
| **Phase 3** | 2-3 days | Docs frontend, help modal integration | All 54 articles served dynamically, help modal works |
| **Phase 4** | 3-4 days | Admin UI | Non-dev can publish article end-to-end |
| **Phase 5** | 2-3 days | Testing, rollout | Production launch, monitoring green |

**Total: ~14-19 days**

---

## 12. Acceptance Criteria (Phase 0)

### Phase 0 Exit Criteria

- [x] **Inventory complete** - All pages, FAQs, help triggers documented
- [x] **Charter approved** - Stakeholder sign-off on approach
- [x] **Schema requirements frozen** - Data model defined
- [x] **Content standards documented** - Metadata spec finalized
- [x] **Risk register published** - Mitigation strategies in place

### Phase 1 Readiness Checklist

- [ ] Supabase schema SQL scripts ready
- [ ] Migration scripts scaffolded
- [ ] Pilot articles selected (getting-started, create-prompt-page)
- [ ] QA validation approach defined

---

## 13. Communication Plan

### Status Updates

- **Daily standup** (async) - AI agent posts progress to shared doc
- **Weekly summary** - Milestone completion, blockers, next phase preview

### Decision Log

All major decisions documented in `PHASE_X_DECISIONS.md`:
- Schema changes
- Content model adjustments
- API contract changes

### Handoff Documentation

Before Phase 5 launch:
- Admin user guide
- Content style guide
- Runbook for common tasks
- Incident response playbook

---

## 14. Success Metrics Dashboard

**During Migration:**
- Articles migrated: X/54
- Parity checks passed: X/X
- Failed tests: X
- Blockers: X

**Post-Launch (30 days):**
- Content updates published: X
- Average time to publish: X minutes
- Help article views: X
- Help modal engagement: X%
- P95 latency: X ms
- Cache hit rate: X%
- Failed fetches: X

---

## Signatures

**Project Owner:** Chris ✅ (Approved 2025-10-03)

**AI Agent:** Claude ✅ (Accepted 2025-10-03)

---

**Charter Status:** ✅ APPROVED

**Next Phase:** Phase 1 - Schema Design & Migration Toolkit

---
