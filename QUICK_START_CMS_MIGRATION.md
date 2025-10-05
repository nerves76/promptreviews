# Help Modal CMS Migration - Quick Start Guide

## TL;DR

✅ **What's Done**: Help modal code updated to use CMS APIs with legacy fallbacks
🔄 **What's Next**: Import articles and context mappings to database

---

## Quick Command Reference

### 1. Import Context Mappings (Run Once)

```bash
cd /Users/chris/promptreviews
npx ts-node scripts/import-context-mappings.ts
```

**Expected Output**:
```
✅ Mappings created: 38
```

### 2. Verify Database Tables Exist

```sql
-- Check articles table
SELECT COUNT(*) FROM articles WHERE status = 'published';

-- Check article_contexts table
SELECT COUNT(*) FROM article_contexts;

-- See example context mapping
SELECT
  ac.route_pattern,
  ac.priority,
  a.slug,
  a.title
FROM article_contexts ac
JOIN articles a ON a.id = ac.article_id
LIMIT 5;
```

### 3. Test New API Endpoints

```bash
# Test contextual articles API
curl -X POST http://localhost:3002/api/docs/contextual \
  -H "Content-Type: application/json" \
  -d '{"route":"/dashboard/prompt-pages","limit":3}'

# Test single article API
curl http://localhost:3002/api/docs/articles/getting-started
```

---

## File Changes Summary

### Modified Files (3)

1. **TutorialsTabNew.tsx** (+150 lines)
   - Uses `/api/docs/contextual` for featured articles
   - Falls back to legacy API for backward compatibility

2. **ArticleViewer.tsx** (+60 lines)
   - Uses `/api/docs/articles/[slug]` for content
   - Markdown-to-HTML conversion
   - Legacy API fallback

3. **fetch-from-docs/route.ts** (+10 lines)
   - Deprecation warnings added
   - JSDoc annotations

### New Files (3)

1. **import-context-mappings.ts** (9.4 KB)
   - Script to migrate route mappings to database

2. **import-context-mappings-README.md** (6.6 KB)
   - Detailed script documentation

3. **HELP_MODAL_CMS_MIGRATION.md** (12 KB)
   - Complete migration report

---

## Testing Checklist

### ✅ Can Test Now (No Data Required)

- [ ] Code compiles without errors
- [ ] API endpoints return 404 for non-existent articles (expected)
- [ ] Deprecation warnings appear when using legacy API
- [ ] Import script runs without errors

### 🔄 Requires Article Data

- [ ] Help modal opens on dashboard
- [ ] Contextual articles appear for each route
- [ ] Article viewer displays markdown content
- [ ] "Back" and "Open in docs" buttons work
- [ ] HelpBubble deep linking works

---

## Troubleshooting

### Import Script Errors

**"Missing Supabase credentials"**
```bash
# Check .env.local has:
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

**"Article not found in database"**
- Articles need to be imported first
- Script will skip missing articles (safe)

### API Returns Empty Arrays

**Contextual API returns `{ articles: [], total: 0 }`**
- Run import-context-mappings.ts script
- Verify articles exist in database

**Article API returns 404**
- Article doesn't exist in database yet
- Check slug matches exactly

### Help Modal Shows "Failed to load"

- Check browser console for errors
- Verify API endpoints are accessible
- Fallback to legacy API should work automatically

---

## Next Steps

1. **Run context mappings import**
   ```bash
   npx ts-node scripts/import-context-mappings.ts
   ```

2. **Import article content** (when docs importer is ready)
   - Use docs importer tool to populate articles table
   - Maintain slug consistency with routes

3. **Test help modal** on each dashboard page:
   - /dashboard
   - /dashboard/prompt-pages
   - /dashboard/widgets
   - /dashboard/contacts
   - /dashboard/google-business
   - etc.

4. **Monitor deprecation warnings**
   - Check server logs for legacy API usage
   - Plan migration timeline for remaining content

5. **Remove fallbacks** (after verification period)
   - Remove legacy API calls
   - Delete deprecated endpoint
   - Clean up hardcoded fallback content

---

## Rollback Plan

If anything breaks:

1. **Code level**: All changes have legacy fallbacks - no action needed
2. **Database level**: Delete imported mappings
   ```sql
   DELETE FROM article_contexts WHERE created_at > '2025-10-03';
   ```
3. **Complete revert**: Git revert the code changes

Help modal will automatically use legacy HTML scraping if CMS fails.

---

## Documentation

- **Full migration report**: `/HELP_MODAL_CMS_MIGRATION.md`
- **Script documentation**: `/scripts/import-context-mappings-README.md`
- **Database schema**: `/supabase/migrations/20251003000000_create_docs_cms_schema.sql`
- **API utilities**: `/src/lib/docs/articles.ts`

---

## Questions?

Check these files for detailed information:

1. Architecture → HELP_MODAL_CMS_MIGRATION.md
2. Script usage → scripts/import-context-mappings-README.md
3. Database schema → supabase/migrations/20251003000000_create_docs_cms_schema.sql
4. API code → src/app/(app)/api/docs/

---

**Last Updated**: 2025-10-03
**Status**: ✅ Ready for context import and testing
