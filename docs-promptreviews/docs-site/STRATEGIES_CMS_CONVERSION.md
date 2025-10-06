# Strategies Pages CMS Conversion Summary

## Completed Tasks

### ✅ 1. Created Import Script
- **File**: `/scripts/import-strategies.ts`
- **Purpose**: Imports strategy content into Supabase CMS
- **Status**: Working and tested

### ✅ 2. Converted Main Strategies Page
- **File**: `/src/app/strategies/page.tsx`
- **Pattern**: Uses `getArticleBySlug('strategies')` and `StandardOverviewLayout`
- **Features**: Full CMS support with fallbacks
- **Status**: Complete

### ✅ 3. Added CMS Articles
- **strategies**: Main overview page
- **strategies/double-dip**: Double-dip strategy (partial)

## Remaining Work

### Pages That Need Conversion

The following strategy pages still use static content and need CMS conversion:

1. **double-dip** (`/src/app/strategies/double-dip/page.tsx`)
   - Current: DocsLayout with static content
   - Needs: CMS integration with `getArticleBySlug('strategies/double-dip')`

2. **reciprocity** (`/src/app/strategies/reciprocity/page.tsx`)
   - Current: DocsLayout with static content
   - Needs: CMS integration with `getArticleBySlug('strategies/reciprocity')`

3. **personal-outreach** (`/src/app/strategies/personal-outreach/page.tsx`)
   - Current: DocsLayout with static content
   - Needs: CMS integration with `getArticleBySlug('strategies/personal-outreach')`

4. **non-ai-strategies** (`/src/app/strategies/non-ai-strategies/page.tsx`)
   - Current: DocsLayout with static content
   - Needs: CMS integration with `getArticleBySlug('strategies/non-ai-strategies')`

5. **novelty** (`/src/app/strategies/novelty/page.tsx`)
   - Current: DocsLayout with static content
   - Needs: CMS integration with `getArticleBySlug('strategies/novelty')`

6. **reviews-on-fly** (`/src/app/strategies/reviews-on-fly/page.tsx`)
   - Current: DocsLayout with static content
   - Needs: CMS integration with `getArticleBySlug('strategies/reviews-on-fly')`

## Conversion Pattern

### Option 1: Keep DocsLayout (Simpler)
For pages using DocsLayout, convert to fetch content from CMS but keep the custom layout:

```typescript
import { getArticleBySlug } from '@/lib/docs/articles'
import MarkdownRenderer from '../../components/MarkdownRenderer'

export async function generateMetadata() {
  const article = await getArticleBySlug('strategies/double-dip')
  return {
    title: article?.metadata?.seo_title || article?.title,
    description: article?.metadata?.seo_description || article?.metadata?.description,
    // ...
  }
}

export default async function DoubleDipPage() {
  const article = await getArticleBySlug('strategies/double-dip')

  if (!article) notFound()

  return (
    <DocsLayout>
      <PageHeader {...headerProps} />
      <MarkdownRenderer content={article.content} />
      {/* Rest of custom sections */}
    </DocsLayout>
  )
}
```

### Option 2: Migrate to StandardOverviewLayout (Consistent)
Convert all strategy pages to use StandardOverviewLayout like the main strategies page.

**Pros:**
- Consistent design
- Easier to manage
- Full CMS feature support

**Cons:**
- Loses some custom layouts
- More work upfront

## Import Script Enhancement

The import script needs to be updated with complete content for all remaining strategy pages:

```typescript
const articles = [
  // ... existing articles ...
  {
    slug: 'strategies/reciprocity',
    title: 'The psychology of getting customer reviews',
    content: `...markdown content...`,
    metadata: { /* extracted from page */ },
    status: 'published'
  },
  // ... more articles
]
```

## Next Steps

1. **Complete the import script** with all strategy pages content
2. **Run the import script** to populate CMS: `npx ts-node scripts/import-strategies.ts`
3. **Convert each page** one by one following the pattern from `strategies/page.tsx`
4. **Test each conversion** to ensure no content loss
5. **Update navigation** if needed

## Files to Reference

### Working Examples
- `/src/app/ai-reviews/page.tsx` - CMS with StandardOverviewLayout
- `/src/app/strategies/page.tsx` - CMS with StandardOverviewLayout (completed)

### Import Script
- `/scripts/import-strategies.ts` - Article import utility

### Library Functions
- `/src/lib/docs/articles.ts` - CMS data fetching

## Testing Checklist

After each page conversion:
- [ ] Page loads without errors
- [ ] Metadata (SEO) is correct
- [ ] All content displays properly
- [ ] Navigation works
- [ ] Icons resolve correctly
- [ ] Links work
- [ ] FAQs display (if applicable)
- [ ] CTAs function properly

## Slugs Reference

All strategy article slugs:
- `strategies` (main page) ✅
- `strategies/double-dip` ⚠️ (partial)
- `strategies/reciprocity` ❌
- `strategies/personal-outreach` ❌
- `strategies/non-ai-strategies` ❌
- `strategies/novelty` ❌
- `strategies/reviews-on-fly` ❌

Legend:
- ✅ Complete
- ⚠️ Partial (article in CMS, page not converted)
- ❌ Not started

## Time Estimate

Per page conversion (assuming import script is complete):
- Extract content: ~5 minutes
- Convert page component: ~10 minutes
- Test and debug: ~5 minutes
- **Total per page: ~20 minutes**
- **Total for 6 remaining pages: ~2 hours**
