# Docs CMS - SEO Fields Implementation

**Date:** 2025-10-05
**Status:** ✅ Complete

## Overview

Added dedicated SEO fields (`seo_title` and `seo_description`) to the Docs CMS, allowing content editors to customize how articles appear in search engines independently from the page title and description.

## Implementation Details

### 1. TypeScript Type Definitions

Added SEO fields to Article metadata interface in 3 locations:

- `/docs-promptreviews/docs-site/src/lib/docs/articles.ts` (lines 28-29)
- `/docs-promptreviews/docs-site/src/lib/articles.ts` (lines 19-20)
- `/src/app/(app)/dashboard/help-content/[slug]/edit/page.tsx` (lines 25-26)

```typescript
interface ArticleMetadata {
  // ... existing fields
  seo_title?: string;
  seo_description?: string;
}
```

### 2. Admin UI Enhancement

**Location:** `/src/app/(app)/dashboard/help-content/[slug]/edit/page.tsx` (lines 455-497)

Added a new "SEO Settings" PageCard section that includes:

- **SEO Title field**
  - 60 character limit
  - Character counter showing optimal range (50-60)
  - Placeholder shows current article title

- **SEO Meta Description field**
  - 160 character limit
  - Character counter showing optimal range (120-160)
  - Multi-line textarea for better editing
  - Placeholder shows current description

- **Helpful context text** explaining the fallback behavior

### 3. Metadata Generation Updates

Updated `generateMetadata()` functions to use SEO fields with graceful fallbacks:

**Pattern used:**
```typescript
const seoTitle = article.metadata?.seo_title || article.title;
const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackText;
```

**Files updated:**
1. `/docs-promptreviews/docs-site/src/app/docs/[slug]/page.tsx` (lines 35-36)
   - Dynamic docs page template
   - Includes OpenGraph and Twitter card metadata

2. `/docs-promptreviews/docs-site/src/app/ai-reviews/page.tsx` (lines 179-180)
   - AI Reviews feature page

3. `/docs-promptreviews/docs-site/src/app/prompt-pages/features/ai-powered/page.tsx` (lines 17-18)
   - AI-Powered Content feature page

### 4. Documentation

Updated `/DOCS_CMS_HANDOFF.md` (lines 77-105) with:
- SEO fields in metadata shape reference
- Character limits and optimal ranges
- Admin UI location reference
- Usage instructions

## Testing

✅ Build verification passed:
```bash
cd docs-promptreviews/docs-site
npm run build
# ✓ Compiled successfully
# ✓ Generating static pages (70/70)
```

## Usage Instructions

### For Content Editors

1. Navigate to `/dashboard/help-content` in the admin UI
2. Select an article to edit (or create new)
3. Scroll to the "SEO Settings" section
4. Fill in custom SEO title and/or description
5. Leave blank to use the article title/description automatically
6. Character counters show optimal lengths for search engines

### For Developers

When creating new page templates that need custom SEO:

```typescript
import { getArticleBySlug } from '@/lib/docs/articles'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const article = await getArticleBySlug('your-slug')

  if (!article) {
    return { title: 'Fallback Title' }
  }

  const seoTitle = article.metadata?.seo_title || article.title
  const seoDescription = article.metadata?.seo_description || article.metadata?.description || 'Fallback description'

  return {
    title: `${seoTitle} | Prompt Reviews`,
    description: seoDescription,
    keywords: article.metadata?.keywords || [],
  }
}
```

## Database Schema

No database migration needed - SEO fields are stored in the existing `metadata` JSONB column:

```sql
-- articles table (already exists)
-- metadata column already supports any JSON structure
{
  "seo_title": "Custom SEO Title Here",
  "seo_description": "Custom meta description optimized for search engines...",
  "description": "Regular page description",
  // ... other metadata fields
}
```

## Benefits

1. **SEO Control** - Content editors can optimize for search engines without affecting page content
2. **Flexibility** - Optional fields with automatic fallbacks
3. **Best Practices** - Character limits enforce SEO best practices
4. **User Friendly** - Visual character counters and helpful placeholders

## Next Steps

Remaining pages to convert to CMS (see DOCS_CMS_HANDOFF.md for full list):

- `/advanced`
- `/analytics`
- `/api`
- `/billing`
- `/business-profile`
- `/contacts`
- `/faq`
- `/features`
- `/getting-started`
- `/google-business`
- `/google-biz-optimizer`
- `/help`
- `/integrations`
- `/reviews`
- `/settings`
- `/strategies`
- `/style-settings`
- `/team`
- `/troubleshooting`
- `/widgets`

And all their subpages. Follow the pattern established in `ai-reviews/page.tsx` for conversion.
