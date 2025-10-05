# Import Context Mappings Script

## Overview

This script migrates route-to-article context mappings from the hardcoded `contextMapper.ts` file into the `article_contexts` database table. This is part of the larger migration from static help content to the dynamic CMS system.

## Purpose

The help modal currently uses hardcoded route mappings in `contextMapper.ts` to determine which articles are relevant for each dashboard page. This script transfers those mappings into the database, enabling:

1. **Dynamic updates** - Context mappings can be updated without code changes
2. **Better relevance scoring** - Priority values help rank articles appropriately
3. **Admin control** - Future admin UI can manage which articles appear where
4. **A/B testing** - Test different article recommendations for different routes

## Prerequisites

Before running this script:

1. **Articles must exist in database** - All referenced articles must be imported to the `articles` table with status='published'
2. **Supabase credentials** - `SUPABASE_SERVICE_ROLE_KEY` must be set in `.env.local`
3. **Migration applied** - The `article_contexts` table must exist (created by `20251003000000_create_docs_cms_schema.sql`)

## Usage

### Basic Run

```bash
cd /Users/chris/promptreviews
npx ts-node scripts/import-context-mappings.ts
```

### Expected Output

```
🚀 Starting context mappings import...

📚 Fetching articles from database...
✅ Found 42 articles

📍 Processing route: /dashboard
   Keywords: dashboard, overview, getting-started, home
   📄 Mapped to 1 article(s): getting-started
   ✅ Created mapping for getting-started

📍 Processing route: /dashboard/prompt-pages
   Keywords: prompt-pages, edit, customize, modify
   📄 Mapped to 3 article(s): prompt-pages, prompt-pages/types/universal, prompt-pages/types/service
   ✅ Created mapping for prompt-pages
   ✅ Created mapping for prompt-pages/types/universal
   ✅ Created mapping for prompt-pages/types/service

...

============================================================
📊 IMPORT SUMMARY
============================================================
✅ Mappings created: 38
⏭️  Mappings skipped: 4
❌ Errors: 0
============================================================

🎉 Context mappings successfully imported to database!
```

## How It Works

### Step 1: Route Context Definitions

The script contains route patterns and their associated keywords:

```typescript
'/dashboard/prompt-pages': {
  keywords: ['prompt-pages', 'edit', 'customize', 'modify'],
  priority: 90
}
```

### Step 2: Keyword-to-Slug Mapping

Keywords are mapped to article slugs that should appear for those routes:

```typescript
'prompt-pages': ['prompt-pages', 'prompt-pages/types/universal', 'prompt-pages/types/service']
```

### Step 3: Database Insertion

For each route + article combination:

1. Check if article exists in database
2. Check if mapping already exists (to avoid duplicates)
3. Insert new `article_contexts` record with:
   - `article_id` (UUID from articles table)
   - `route_pattern` (dashboard route)
   - `keywords` (array of relevant terms)
   - `priority` (0-100, higher = more relevant)

## Route Patterns Included

Currently imports mappings for:

- `/dashboard` - Dashboard homepage
- `/dashboard/create-prompt-page` - Create new prompt page
- `/dashboard/edit-prompt-page` - Edit existing prompt page
- `/dashboard/contacts` - Contact management
- `/dashboard/business-profile` - Business settings
- `/dashboard/style` - Style/branding settings
- `/dashboard/widget` - Widget configuration
- `/dashboard/google-business` - Google Business Profile
- `/dashboard/reviews` - Reviews management
- `/dashboard/team` - Team management
- `/dashboard/plan` - Billing & subscription
- `/dashboard/analytics` - Analytics dashboard
- `/prompt-pages` - Public prompt pages list
- `/r/` - Review submission pages

## Customization

### Adding New Routes

Edit the `routeContextMap` object:

```typescript
'/dashboard/new-feature': {
  keywords: ['new', 'feature', 'custom'],
  pageName: 'New Feature',
  priority: 85
}
```

### Adding Article Mappings

Edit the `keywordToSlugMappings` object:

```typescript
'new-feature': ['help/new-feature', 'getting-started/new-feature']
```

### Adjusting Priorities

Priority values (0-100) control article ranking:

- **90-100**: Critical/primary articles for this route
- **80-89**: Highly relevant secondary articles
- **70-79**: Somewhat relevant articles
- **50-69**: General/background articles
- **0-49**: Low relevance articles

## Verification

After running the script, verify the import:

```sql
-- Check total mappings
SELECT COUNT(*) FROM article_contexts;

-- Check mappings for a specific route
SELECT
  ac.route_pattern,
  ac.priority,
  a.title,
  a.slug
FROM article_contexts ac
JOIN articles a ON a.id = ac.article_id
WHERE ac.route_pattern = '/dashboard/prompt-pages'
ORDER BY ac.priority DESC;
```

## Troubleshooting

### "Article not found in database"

**Cause**: Referenced article slug doesn't exist in `articles` table
**Fix**: Import the missing article or update the slug mapping

### "Missing Supabase credentials"

**Cause**: Environment variables not loaded
**Fix**: Ensure `.env.local` exists and contains `SUPABASE_SERVICE_ROLE_KEY`

### "Mappings already exist"

**Cause**: Script has been run before
**Fix**: This is normal - script will skip existing mappings. Delete from `article_contexts` table if you want to re-import.

## Integration with Help System

Once imported, the help modal uses these mappings via the `/api/docs/contextual` endpoint:

```typescript
// Help modal fetches contextual articles
const response = await fetch('/api/docs/contextual', {
  method: 'POST',
  body: JSON.stringify({
    route: '/dashboard/prompt-pages',
    limit: 6
  })
});

// Returns articles ordered by priority
const { articles } = await response.json();
```

## Future Enhancements

- [ ] Admin UI for managing context mappings
- [ ] A/B testing for article recommendations
- [ ] Analytics tracking which articles help users most
- [ ] Automatic keyword extraction from article content
- [ ] Machine learning to improve relevance over time

## Related Files

- `/src/lib/docs/articles.ts` - Server utilities for fetching articles
- `/src/app/(app)/api/docs/contextual/route.ts` - API endpoint using these mappings
- `/src/app/(app)/components/help/contextMapper.ts` - Original hardcoded mappings (to be deprecated)
- `/supabase/migrations/20251003000000_create_docs_cms_schema.sql` - Database schema

## Support

For issues or questions:
1. Check the console output for specific error messages
2. Verify prerequisites are met
3. Review the database schema to ensure tables exist
4. Check Supabase logs for permission issues
