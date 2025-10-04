# Phase 0: Docs Content Migration - Inventory & Discovery

**Date:** 2025-10-03
**Agent:** Information Architect
**Status:** Completed

## Executive Summary

The docs site and help system are currently operational but tightly coupled to code. Migration to Supabase CMS will require coordinated changes across **3 distinct systems**:

1. **Docs Site** - Static Next.js site at `docs-promptreviews/docs-site` (~54 pages)
2. **Help Modal** - In-app help drawer with tutorials, FAQs, and issue reporting
3. **API Bridge** - Server-side APIs that connect help modal to docs site

## System Architecture

### Current Data Flow

```
┌─────────────────┐
│  Docs Site      │
│  (Vercel)       │ ← Hardcoded TSX pages
│  Port 3001      │ ← Centralized faqData.ts
└────────┬────────┘ ← Fixed Sidebar nav
         │
         │ Fetches HTML at runtime
         ↓
┌─────────────────┐
│  Main App       │
│  (Vercel)       │
│  Port 3002      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Help Modal     │ ← HelpBubble trigger
│  (Client)       │ ← 3 tabs: Tutorials, FAQs, Issues
└────────┬────────┘ ← Context-aware by route
         │
         ↓
┌─────────────────────────────────────────┐
│  Help APIs                              │
│  /api/help-docs/tutorials    ← Fallback │
│  /api/help-docs/content      ← Scrapes  │
│  /api/help-docs/fetch-from-docs         │
└─────────────────────────────────────────┘
```

---

## 1. Docs Site Inventory

### File Structure
```
docs-promptreviews/docs-site/
├── src/app/
│   ├── getting-started/
│   │   ├── page.tsx
│   │   ├── account-setup/page.tsx
│   │   ├── adding-contacts/page.tsx
│   │   ├── choosing-plan/page.tsx
│   │   ├── first-prompt-page/page.tsx
│   │   ├── first-review-request/page.tsx
│   │   └── review-widget/page.tsx
│   ├── prompt-pages/
│   │   ├── page.tsx
│   │   ├── features/page.tsx
│   │   └── types/
│   │       ├── page.tsx
│   │       ├── employee/page.tsx
│   │       ├── event/page.tsx
│   │       ├── photo/page.tsx
│   │       ├── product/page.tsx
│   │       ├── service/page.tsx
│   │       ├── universal/page.tsx
│   │       └── video/page.tsx
│   ├── strategies/
│   │   ├── page.tsx
│   │   ├── double-dip/page.tsx
│   │   ├── non-ai-strategies/page.tsx
│   │   ├── novelty/page.tsx
│   │   ├── personal-outreach/page.tsx
│   │   ├── reciprocity/page.tsx
│   │   └── reviews-on-fly/page.tsx
│   ├── advanced/page.tsx
│   ├── ai-reviews/page.tsx
│   ├── analytics/page.tsx
│   ├── api/
│   │   ├── page.tsx
│   │   ├── reference/page.tsx
│   │   └── search/route.ts  ← Search API for main app
│   ├── billing/page.tsx
│   ├── business-profile/page.tsx
│   ├── contacts/page.tsx
│   ├── faq/page.tsx
│   ├── faq-comprehensive/page.tsx
│   ├── features/page.tsx
│   ├── google-business/page.tsx
│   ├── google-biz-optimizer/page.tsx
│   ├── help/page.tsx
│   ├── integrations/page.tsx
│   ├── reviews/page.tsx
│   ├── settings/page.tsx
│   ├── style-settings/page.tsx
│   ├── team/page.tsx
│   ├── troubleshooting/page.tsx
│   ├── widgets/page.tsx
│   ├── page.tsx  ← Homepage
│   ├── layout.tsx
│   └── utils/
│       └── faqData.ts  ← 643 lines, 10 categories
├── src/components/
│   ├── Header.tsx
│   ├── Sidebar.tsx  ← 161 sections, hardcoded nav
│   ├── StandardOverviewLayout.tsx
│   └── PromptReviewsLogo.tsx
└── package.json
```

### Content Statistics

| Metric | Count |
|--------|-------|
| Total TSX pages | 54 |
| Categories | 11 (Getting Started, Prompt Pages, Strategies, etc.) |
| FAQ entries | ~85+ (10 categories in faqData.ts) |
| Navigation sections | 10 top-level, ~40 children |
| Strategies articles | 6 |

### Current Content Categories

1. **Getting Started** (7 pages)
2. **Prompt Pages** (8 pages: overview, types, features)
3. **Strategies** (7 pages: overview + 6 strategies)
4. **Features** (1 page)
5. **Advanced** (1 page)
6. **AI Reviews** (1 page)
7. **Analytics** (1 page)
8. **API** (2 pages)
9. **Integrations** (4 pages: Google Business, widgets, etc.)
10. **Help & Support** (4 pages: FAQ, troubleshooting, team, billing)
11. **Settings** (3 pages: business profile, style, team)

### Component Patterns

All doc pages use **StandardOverviewLayout** with props:
- `title` - Page heading
- `description` - Page description
- `categoryLabel` - Badge text
- `categoryIcon` - Lucide icon
- `categoryColor` - Tailwind color
- `keyFeatures` - Array of feature objects
- `howItWorks` - Step-by-step objects
- `bestPractices` - Tips array
- `faqs` - FAQ array from faqData.ts
- `callToAction` - CTA buttons
- `availablePlans` - Plan availability

**Critical:** All content is hardcoded in TSX - no separation of content from presentation.

---

## 2. Help System Inventory

### Help Modal Components

Located in: `/src/app/(app)/components/help/`

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `HelpModal.tsx` | Main modal container | 3 tabs, context-aware |
| `HelpBubble.tsx` | Inline help trigger | Opens modal with specific article |
| `ArticleViewer.tsx` | Article display | Fetches & renders HTML from docs |
| `TutorialsTabNew.tsx` | Tutorials tab | Lists relevant tutorials |
| `FAQsTab.tsx` | FAQs tab | Context-filtered FAQs |
| `IssuesTab.tsx` | Issue reporting | Feedback form |
| `contextMapper.ts` | Route mapping | Maps app routes to keywords |
| `types.ts` | TypeScript types | Tutorial, FAQ interfaces |

### Context Mapping System

**File:** `src/app/(app)/components/help/contextMapper.ts`

Routes mapped to keywords, pageName, and helpTopics:

```typescript
'/dashboard/create-prompt-page': {
  keywords: ['prompt-pages', 'create', 'setup', 'new'],
  pageName: 'Create Prompt Page',
  helpTopics: ['prompt-types', 'customization', 'publishing']
}
```

**Total routes mapped:** 12 dashboard routes + 2 public routes

### Help APIs

Located in: `/src/app/(app)/api/help-docs/`

| Endpoint | Method | Purpose | Data Source |
|----------|--------|---------|-------------|
| `/tutorials` | POST | Fetch relevant tutorials | Docs API + fallback |
| `/content` | POST | Fetch article content | Scrapes docs site HTML |
| `/fetch-from-docs` | POST | Article content by ID | Maps ID to path, fetches HTML |
| `/faqs` | GET/POST | Fetch FAQs | Hardcoded (needs migration) |

#### Tutorial Fetching Logic

1. **POST to docs site search API** (`/api/search`)
   - Sends `keywords`, `pathname`, `limit: 6`
   - Falls back to hardcoded tutorials if API fails
2. **Relevance scoring** (0-100):
   - Tag match: +20 per tag
   - Category match: +30
   - Exact match: +25
3. **Plan filtering** - Filters by user's subscription plan
4. **Top 6 tutorials** returned, sorted by relevance

#### Article Scraping

`fetch-from-docs` API:
- Fetches full HTML from docs site
- Extracts `<main>`, `<article>`, or `.content`
- Strips: scripts, styles, nav, footer, icons, FAQs, "related articles"
- Fixes relative links to absolute docs URLs
- Returns cleaned HTML for display in modal

**Issues:**
- ⚠️ **Fragile scraping** - Breaks if HTML structure changes
- ⚠️ **No caching** - Fetches on every article view
- ⚠️ **Hardcoded article ID mapping** - 60+ hardcoded paths

---

## 3. Help Drawer Integration Points

### Trigger Mechanisms

1. **HelpBubble** - Inline question mark icons throughout dashboard
   - Usage: `<HelpBubble articlePath="metrics/total-reviews" />`
   - 20+ instances across dashboard components

2. **Keyboard shortcut** - Press `?` anywhere in app
   - Global listener in layout

3. **Deep links** - `/help?article=slug#anchor`
   - Not yet implemented but planned

### Context Awareness

Help modal uses pathname to determine relevant content:

| Route | Keywords | Featured Topics |
|-------|----------|-----------------|
| `/dashboard` | dashboard, overview, getting-started | navigation, metrics, quick-actions |
| `/dashboard/create-prompt-page` | prompt-pages, create, setup | prompt-types, customization, publishing |
| `/dashboard/contacts` | contacts, manage, upload | csv-upload, contact-management, bulk-actions |
| `/dashboard/widget` | widgets, embed, website | widget-types, embedding, customization |
| `/dashboard/google-business` | google, business-profile, integration | connection, sync, reviews-import, bulk-updates |

**Relevance Algorithm:**
- Matches current route keywords to article tags/categories
- Scores each tutorial 0-100
- Shows top 6 most relevant

---

## 4. FAQ System

### Current Implementation

**File:** `docs-promptreviews/docs-site/src/app/utils/faqData.ts`

**Structure:**
```typescript
export const pageFAQs = {
  'getting-started': [
    { question, answer, plans: ['grower', 'builder', 'maven'] }
  ],
  'prompt-pages': [...],
  'contacts': [...],
  // ... 10 total categories
}

export const consolidatedFAQs = [
  {
    category: 'Getting Started & Setup',
    faqs: [...]
  }
  // ... 10 categories
]
```

**Statistics:**
- 10 FAQ categories
- ~85 total FAQs
- Plan-specific answers (grower/builder/maven filters)

**Display Locations:**
1. Docs site pages (via `StandardOverviewLayout`)
2. Help modal FAQs tab
3. Comprehensive FAQ page (`/faq-comprehensive`)

**Migration Challenge:**
FAQs are duplicated across pageFAQs and consolidatedFAQs with different structures.

---

## 5. Technical Dependencies

### Docs Site Stack

```json
{
  "framework": "Next.js 14.0.0",
  "react": "18.2.0",
  "mdx": "@next/mdx ^14.0.0",  // Installed but UNUSED
  "styling": "Tailwind CSS 3.3.5",
  "icons": "lucide-react ^0.292.0",
  "deployment": "Vercel (separate instance)",
  "port": "3001"
}
```

### Main App Dependencies

```json
{
  "framework": "Next.js 15.3.2",
  "react": "19.1.0",
  "database": "Supabase (PostgreSQL)",
  "auth": "Supabase Auth",
  "port": "3002"
}
```

### API Communication

- Main app fetches from docs site at runtime
- No shared database or content API
- Scraping HTML as content source
- 5-second timeout on external fetches

---

## 6. Migration Scope & Priorities

### High Priority (Phase 1)

**Critical help articles** - Featured in dashboard contexts:

1. Getting Started (quickstart flow - 6 articles)
2. Prompt Pages overview + types (4 articles)
3. Google Business integration (1 article)
4. Widgets (1 article)
5. Contacts management (1 article)

**Total:** ~13 critical articles

### Medium Priority (Phase 2)

- Strategies section (7 articles)
- Advanced features (5 articles)
- Remaining getting-started guides
- **Total:** ~20 articles

### Lower Priority (Phase 3)

- API documentation
- Comprehensive FAQ consolidation
- Style guides
- Troubleshooting
- **Total:** ~21 articles

### Phase 4 - FAQs

- Migrate 85+ FAQ entries
- Normalize pageFAQs vs consolidatedFAQs
- Add plan-based filtering in database

---

## 7. Content Extraction Challenges

### Hardcoded Components

Many pages use complex TSX components that need manual conversion:

```tsx
<div className="grid md:grid-cols-3 gap-6">
  {keyFeatures.map(feature => (
    <FeatureCard icon={feature.icon} ... />
  ))}
</div>
```

**Solution:** Convert to MDX with custom components OR store as JSON metadata.

### Dynamic Content

- Icon components (Lucide React)
- Interactive accordions
- Code snippets with syntax highlighting
- Embedded CTAs with tracking

**Solution:**
- Store icons as string names in metadata
- Use MDX for interactive elements
- Preserve tracking params in content

### Metadata in Frontmatter

Each page has SEO metadata that must be preserved:

```typescript
export const metadata: Metadata = {
  title: 'Getting Started - Prompt Reviews',
  description: '...',
  keywords: ['...'],
  alternates: { canonical: 'https://docs.promptreviews.app/...' }
}
```

**Solution:** Store in article metadata table.

---

## 8. Identified Gaps & Risks

### Gaps

1. ❌ **No revision history** - Can't track content changes
2. ❌ **No draft workflow** - All edits go live immediately
3. ❌ **No content search** - Only rudimentary keyword matching
4. ❌ **No media management** - Images embedded as hardcoded paths
5. ❌ **No analytics** - Don't know which articles are most helpful
6. ❌ **Article aliases** - No way to handle slug changes/redirects

### Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Content migration fidelity | High | Automated extraction + manual QA on critical articles |
| Help modal breaks during migration | Critical | Phased rollout with feature flag |
| Scraping fails post-migration | Medium | Implement proper content API |
| Anchor link stability | High | Generate deterministic IDs from headings |
| Context mapping accuracy | Medium | Preserve exact keyword sets |
| Plan-based filtering breaks | Low | Explicit plan columns in database |

---

## 9. Success Metrics (from Charter)

- ✅ Enable non-developers to edit content (admin UI)
- ✅ Serve dynamically from Supabase
- ✅ Reduce publish cycle to <5 minutes
- ✅ Guarantee 100% parity of help triggers
- ✅ P95 latency ≤300ms

---

## 10. Next Steps (Phase 1)

1. **Schema Design** - Design Supabase tables
   - `articles` (id, slug, title, content, metadata, status, timestamps)
   - `faqs` (id, question, answer, category, plans, order)
   - `navigation` (id, parent_id, title, href, icon, order, visibility)
   - `article_contexts` (article_id, route, keywords[], weight)
   - `article_revisions` (article_id, content, editor, timestamp)

2. **Migration Toolkit**
   - TSX → Markdown extractor
   - FAQ data transformer
   - Sidebar structure exporter
   - Context mapping migrator

3. **Pilot Migration**
   - Target: "Getting Started" page + "Create Prompt Page"
   - Validate: HTML output parity
   - Test: Help modal context matching

---

## Appendix A: File Inventory

### Docs Site Pages (54 total)

<details>
<summary>Full page list</summary>

```
src/app/advanced/page.tsx
src/app/ai-reviews/page.tsx
src/app/analytics/page.tsx
src/app/api/page.tsx
src/app/api/reference/page.tsx
src/app/billing/page.tsx
src/app/business-profile/page.tsx
src/app/contacts/page.tsx
src/app/faq-comprehensive/page.tsx
src/app/faq/page.tsx
src/app/features/page.tsx
src/app/getting-started/account-setup/page.tsx
src/app/getting-started/adding-contacts/page.tsx
src/app/getting-started/choosing-plan/page.tsx
src/app/getting-started/first-prompt-page/page.tsx
src/app/getting-started/first-review-request/page.tsx
src/app/getting-started/page.tsx
src/app/getting-started/review-widget/page.tsx
src/app/google-biz-optimizer/page.tsx
src/app/google-business/page.tsx
src/app/help/page.tsx
src/app/integrations/page.tsx
src/app/page.tsx
src/app/prompt-pages/features/page.tsx
src/app/prompt-pages/page.tsx
src/app/prompt-pages/types/employee/page.tsx
src/app/prompt-pages/types/event/page.tsx
src/app/prompt-pages/types/page.tsx
src/app/prompt-pages/types/photo/page.tsx
src/app/prompt-pages/types/product/page.tsx
src/app/prompt-pages/types/service/page.tsx
src/app/prompt-pages/types/universal/page.tsx
src/app/prompt-pages/types/video/page.tsx
src/app/reviews/page.tsx
src/app/settings/page.tsx
src/app/strategies/double-dip/page.tsx
src/app/strategies/non-ai-strategies/page.tsx
src/app/strategies/novelty/page.tsx
src/app/strategies/page.tsx
src/app/strategies/personal-outreach/page.tsx
src/app/strategies/reciprocity/page.tsx
src/app/strategies/reviews-on-fly/page.tsx
src/app/style-settings/page.tsx
src/app/team/page.tsx
src/app/troubleshooting/page.tsx
src/app/widgets/page.tsx
```
</details>

### Help System Files (9 core files)

```
src/app/(app)/components/help/HelpModal.tsx
src/app/(app)/components/help/HelpBubble.tsx (also in src/components/ui/)
src/app/(app)/components/help/ArticleViewer.tsx
src/app/(app)/components/help/TutorialsTabNew.tsx
src/app/(app)/components/help/FAQsTab.tsx
src/app/(app)/components/help/IssuesTab.tsx
src/app/(app)/components/help/contextMapper.ts
src/app/(app)/components/help/types.ts
```

### API Routes (4 files)

```
src/app/(app)/api/help-docs/tutorials/route.ts
src/app/(app)/api/help-docs/content/route.ts
src/app/(app)/api/help-docs/fetch-from-docs/route.ts
src/app/(app)/api/help-docs/faqs/route.ts
docs-promptreviews/docs-site/src/app/api/search/route.ts
```

---

## Appendix B: Sample Content Structure

### Example Page (Getting Started)

```tsx
export const metadata: Metadata = {
  title: 'Getting Started with Prompt Reviews',
  description: 'Learn how to set up your account...',
  keywords: ['setup', 'quickstart', 'getting-started']
}

const keyFeatures = [
  {
    icon: CheckCircle,
    title: 'Quick Setup Process',
    description: 'Get your account set up in under 30 minutes'
  },
  // ... 5 more
]

const howItWorks = [
  { number: 1, title: 'Create Account', description: '...', icon: Settings },
  // ... 3 more
]

const bestPractices = [
  { icon: Clock, title: 'Start with Recent Customers', description: '...' },
  // ... 3 more
]

export default function GettingStartedPage() {
  return (
    <StandardOverviewLayout
      title="Getting started"
      description="..."
      categoryLabel="Quick Start Guide"
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['getting-started']}
      ...
    />
  )
}
```

**Migration Strategy:**
- Metadata → `articles.metadata` JSON
- keyFeatures/howItWorks/bestPractices → `articles.content` as MDX or JSON
- FAQs → separate `faqs` table with foreign key

---

**End of Inventory**
