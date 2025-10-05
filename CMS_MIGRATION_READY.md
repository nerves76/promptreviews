# CMS Migration - Ready to Execute

## What Was Created

### 1. Migration Script (`scripts/migrate-static-docs-to-cms.ts`)
Imports all 57 static `.tsx` documentation pages into the `articles` database table.

**Features:**
- Automatically scans all `page.tsx` files in docs-site
- Extracts metadata (title, description, keywords)
- Converts JSX content to markdown
- Inserts/updates articles in database
- Preserves existing articles (idempotent - safe to run multiple times)

### 2. Updated Context Mappings (`scripts/import-context-mappings.ts`)
Enhanced to include:
- All 9 new feature pages
- Better keyword mappings for contextual help
- Support for Prompt Pages features, types, and settings

### 3. Documentation (`scripts/DOCS_MIGRATION_README.md`)
Complete guide covering:
- Step-by-step migration instructions
- Troubleshooting
- Testing procedures
- Content update workflows

## How to Run the Migration

### Step 1: Import Articles to Database

```bash
cd /Users/chris/promptreviews
npx ts-node scripts/migrate-static-docs-to-cms-enhanced.ts
```

**Expected result:** 57 articles imported with FULL design preservation

**What gets preserved:**
- ✅ Structured sections (How it Works, Key Features, Best Practices)
- ✅ Icons (Lucide → emoji conversion)
- ✅ Multi-column grids and cards
- ✅ Visual hierarchy and styling
- ✅ Colored gradients via metadata

### Step 2: Create Contextual Help Mappings

```bash
npx ts-node scripts/import-context-mappings.ts
```

**Expected result:** Route-to-article mappings created for help modal

## What This Enables

### ✅ Contextual Help System
- Help modal shows relevant articles based on current page
- `/dashboard` → Getting Started, Dashboard Overview
- `/dashboard/create-prompt-page` → Prompt Pages, Types, First Prompt Page
- `/dashboard/widget` → Widgets, Installation, Customization
- Etc.

### ✅ Admin UI for Content Management
- Edit articles at `/dashboard/help-content`
- No code changes needed for content updates
- Version tracking via `updated_at` timestamps

### ✅ Dynamic Content Routing
- Articles accessible at `/docs/[slug]`
- Markdown rendering with proper formatting
- SEO-optimized metadata

## Contextual Help Mappings

Here's how articles will be featured on each page:

| Dashboard Page | Featured Articles (max 3) |
|----------------|---------------------------|
| `/dashboard` | Getting Started, First Prompt Page, Account Setup |
| `/dashboard/create-prompt-page` | First Prompt Page, Prompt Pages, Universal Type |
| `/dashboard/edit-prompt-page` | Prompt Page Settings, Customization, AI-Powered |
| `/dashboard/contacts` | Contacts, Adding Contacts |
| `/dashboard/business-profile` | Business Profile, Branding, Google Business |
| `/dashboard/style` | Style Settings, Customization, Branding |
| `/dashboard/widget` | Widgets, Review Widget, Installation |
| `/dashboard/google-business` | Google Business, Integration, Sync |
| `/dashboard/reviews` | Reviews Management, Verification |
| `/dashboard/team` | Team Management, Roles, Invitations |
| `/dashboard/plan` | Billing, Upgrades/Downgrades, Choosing a Plan |
| `/dashboard/analytics` | Analytics, Insights, Analytics Feature |

## Testing the Migration

After running both scripts:

1. **Verify Database Content**
   ```sql
   SELECT COUNT(*) FROM articles;
   -- Should return: 57

   SELECT slug, title FROM articles ORDER BY slug LIMIT 10;
   -- Should show various article slugs

   SELECT COUNT(*) FROM article_contexts;
   -- Should return: 38+ (one mapping per route-article pair)
   ```

2. **Test Help Modal**
   - Open PromptReviews app
   - Go to `/dashboard`
   - Click help icon (?)
   - Verify "Getting Started" appears
   - Click an article to view content

3. **Test All Major Routes**
   - `/dashboard/create-prompt-page` - Should show Prompt Pages guides
   - `/dashboard/widget` - Should show Widgets docs
   - `/dashboard/plan` - Should show Billing & Plans

## Design Preservation 🎨

The **enhanced migration script** (`migrate-static-docs-to-cms-enhanced.ts`) preserves ALL design elements by extracting structured metadata.

### What Gets Preserved ✅

- ✅ **How It Works sections** → Numbered steps with icons
- ✅ **Key Features grids** → Multi-column cards with icons
- ✅ **Best Practices** → Icon + title + description cards
- ✅ **Icons** → Lucide components converted to emojis (📱, 🎨, 🔒, etc.)
- ✅ **Multi-column layouts** → Preserved via metadata arrays
- ✅ **Visual hierarchy** → Section structure maintained
- ✅ **Styled cards** → Rendered by dynamic template

### Example Output

When the script processes a feature page, it extracts:

```json
{
  "metadata": {
    "key_features": [
      { "icon": "🎨", "title": "Customization", "description": "Full branding control" }
    ],
    "how_it_works": [
      { "number": 1, "icon": "▶️", "title": "Upload assets", "description": "Add your logo" }
    ],
    "best_practices": [
      { "icon": "💡", "title": "Keep it simple", "description": "Avoid clutter" }
    ]
  }
}
```

The `/docs/[slug]` template then renders these with full styling - exactly as designed!

## Post-Migration Options

### Option A: Keep Static Files (Recommended Initially)
- Static `.tsx` files remain as fallback
- CMS takes precedence
- Safe transition period

### Option B: Remove Static Files
- Delete all `page.tsx` files except:
  - `docs/[slug]/page.tsx` (dynamic route)
  - `page.tsx` (homepage)
- Fully CMS-driven documentation
- Cleaner codebase

## Updating Content After Migration

### Method 1: Admin UI (Easiest)
1. Go to `/dashboard/help-content`
2. Find article
3. Click "Edit"
4. Update markdown
5. Click "Publish"

### Method 2: Re-run Migration
1. Edit static `.tsx` file
2. Run: `npx ts-node scripts/migrate-static-docs-to-cms.ts`
3. Script updates existing article in database

## Important Notes

- **Slugs are unique**: The migration uses slugs as identifiers
- **Idempotent**: Safe to run migration multiple times
- **Non-destructive**: Existing articles are updated, not duplicated
- **Markdown format**: All content converted to markdown for easy editing

## Rollback Plan

If anything goes wrong:

```sql
-- Delete all articles
DELETE FROM articles WHERE created_at > '2025-10-04';

-- Delete all context mappings
DELETE FROM article_contexts WHERE created_at > '2025-10-04';
```

Static `.tsx` files remain untouched, so docs site continues working.

## Next Steps

1. ✅ Run migration script
2. ✅ Run context mappings script
3. ✅ Test help modal
4. ✅ Train team on admin UI
5. 📋 Consider removing static files (optional)
6. 📋 Set up content review workflow

---

**Status**: Ready to migrate
**Created**: October 4, 2025
**Scripts Location**: `/Users/chris/promptreviews/scripts/`
