# Documentation CMS Migration Guide

This guide explains how to migrate static documentation pages to the CMS database system.

## Overview

The migration process consists of two steps:

1. **Import Articles**: Migrate static `.tsx` files to the `articles` database table
2. **Import Context Mappings**: Create relationships between routes and articles for contextual help

## Prerequisites

- Supabase credentials configured in `.env.local`
- Database schema in place (from `20251003000000_create_docs_cms_schema.sql`)
- Static documentation pages in `docs-promptreviews/docs-site/src/app/`

## Step 1: Import Articles

This script reads all static `.tsx` documentation pages and imports them into the database:

```bash
cd /Users/chris/promptreviews
npx ts-node scripts/migrate-static-docs-to-cms.ts
```

### What It Does

- Scans all `page.tsx` files in the docs-site
- Extracts metadata (title, description, keywords)
- Converts JSX content to markdown
- Inserts/updates articles in the database
- Preserves existing articles (updates instead of duplicating)

### Expected Output

```
📄 Found 57 static page files

📝 Processing: prompt-pages/features/ai-powered
   Title: AI-Powered Content
   Content length: 3245 chars
   ✅ Created new article

...

📊 MIGRATION SUMMARY
✅ Articles created: 57
🔄 Articles updated: 0
⏭️  Articles skipped: 0
❌ Errors: 0
```

## Step 2: Import Context Mappings

After articles are imported, create route-to-article relationships:

```bash
npx ts-node scripts/import-context-mappings.ts
```

### What It Does

- Maps dashboard routes to relevant articles
- Assigns priority scores for ranking
- Creates entries in `article_contexts` table
- Enables contextual help modal

### Route Mappings

The help modal will show relevant articles based on the current page:

| Route | Featured Articles |
|-------|------------------|
| `/dashboard` | Getting Started, Dashboard Overview |
| `/dashboard/create-prompt-page` | Prompt Pages, Types, First Prompt Page |
| `/dashboard/edit-prompt-page` | Prompt Pages, Settings, Customization |
| `/dashboard/contacts` | Contacts Management, Import Guide |
| `/dashboard/widget` | Widgets, Installation, Customization |
| `/dashboard/google-business` | Google Business Profile, Connection, Sync |
| `/dashboard/plan` | Billing, Plans, Upgrades/Downgrades |

## Customizing Context Mappings

To add or modify which articles appear on specific pages, edit the mappings in `scripts/import-context-mappings.ts`:

```typescript
// Add a new route mapping
'/dashboard/my-custom-page': {
  keywords: ['custom', 'feature', 'help'],
  pageName: 'My Custom Page',
  helpTopics: ['setup', 'usage', 'tips'],
  priority: 85  // Higher = more important (0-100)
}

// Then add slug mappings
const keywordToSlugMappings: Record<string, string[]> = {
  'custom': ['my-custom-article', 'related-article'],
  // ...
}
```

After editing, re-run the context mappings import.

## Testing

After migration:

1. Open the PromptReviews app
2. Navigate to any dashboard page
3. Click the help icon (?)
4. Verify that relevant articles appear in the help modal
5. Click an article to view its content
6. Confirm content displays properly

### Test Pages

Priority test pages:
- `/dashboard` - Should show Getting Started
- `/dashboard/create-prompt-page` - Should show Prompt Pages guides
- `/dashboard/widget` - Should show Widgets documentation
- `/dashboard/plan` - Should show Billing & Plans

## Updating Content

Once migrated, you can edit articles in two ways:

### Option 1: Admin UI (Recommended)

1. Log in to PromptReviews as an admin
2. Navigate to `/dashboard/help-content`
3. Find the article you want to edit
4. Click "Edit"
5. Make changes in the markdown editor
6. Save and publish

### Option 2: Re-run Migration

If you prefer to edit the static `.tsx` files:

1. Edit the file in `docs-promptreviews/docs-site/src/app/`
2. Re-run: `npx ts-node scripts/migrate-static-docs-to-cms.ts`
3. The script will **update** the existing article in the database

## Troubleshooting

### Articles Not Showing in Help Modal

1. Verify articles are published: `SELECT slug, status FROM articles;`
2. Check context mappings exist: `SELECT * FROM article_contexts;`
3. Ensure slugs match in both tables

### Content Not Converting Properly

The JSX-to-markdown converter handles common patterns. For complex JSX:

1. Simplify the JSX structure
2. Or manually edit the content in the admin UI after migration

### Duplicate Articles

The script uses `slug` as the unique identifier. If you see duplicates:

```sql
-- Find duplicates
SELECT slug, COUNT(*) FROM articles GROUP BY slug HAVING COUNT(*) > 1;

-- Delete duplicates (keep the newest)
DELETE FROM articles a USING articles b
WHERE a.id < b.id AND a.slug = b.slug;
```

## Rollback

To rollback the migration:

```sql
-- Delete all migrated articles
DELETE FROM articles WHERE created_at > '2025-10-04';

-- Delete all context mappings
DELETE FROM article_contexts WHERE created_at > '2025-10-04';
```

The static `.tsx` files remain untouched, so the docs site will continue working.

## Next Steps After Migration

1. ✅ Run both migration scripts
2. ✅ Test help modal on all major pages
3. ✅ Train team on using admin UI for content updates
4. 📋 Consider removing static `.tsx` files (optional)
5. 📋 Update build process to use database content only

## Future Enhancements

- Add versioning for article changes
- Implement article analytics (views, helpfulness ratings)
- Create article templates for common patterns
- Add approval workflow for content changes
- Generate API documentation automatically

## Support

For issues or questions:
- Check Supabase logs for database errors
- Review script output for specific error messages
- Verify environment variables are set correctly

---

**Last Updated**: October 4, 2025
**Maintained By**: Development Team
