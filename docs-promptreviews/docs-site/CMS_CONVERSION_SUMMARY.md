# CMS Conversion Project Summary

## Overview

This document summarizes the approach for converting 22 top-level documentation pages from static React components to a CMS-driven pattern, following the reference implementation in `/src/app/ai-reviews/page.tsx`.

## Deliverables Created

### 1. Comprehensive Conversion Guide
**File**: `CMS_CONVERSION_GUIDE.md`

This guide provides:
- Detailed instructions for the conversion pattern
- Complete CMS article JSON for the first 5 pages
- Standard page.tsx template that can be adapted for all pages
- Step-by-step process for each conversion
- Special notes for edge cases (like API Reference page)

### 2. Automated Migration Script
**File**: `scripts/migrate-to-cms.mjs`

A Node.js script that can:
- Extract content from existing page.tsx files
- Create CMS articles via the admin API
- Generate new CMS-pattern page.tsx files
- Create backups of original files
- Generate a detailed migration report

**Usage**:
```bash
ADMIN_API_KEY=your_admin_api_key node scripts/migrate-to-cms.mjs
```

## Pages to Convert

| # | Path | Slug | Layout Type | Complexity |
|---|------|------|-------------|------------|
| 1 | `/advanced` | `advanced` | Standard | Medium |
| 2 | `/analytics` | `analytics` | Standard | Low |
| 3 | `/api` | `api` | Standard | High (code examples) |
| 4 | `/api/reference` | `api-reference` | DocsLayout | **Special Case** |
| 5 | `/billing` | `billing` | Standard | Low |
| 6 | `/billing/upgrades-downgrades` | `billing-upgrades-downgrades` | Standard | Low |
| 7 | `/business-profile` | `business-profile` | Standard | Low |
| 8 | `/contacts` | `contacts` | Standard | Low |
| 9 | `/faq` | `faq` | Standard | Medium |
| 10 | `/faq-comprehensive` | `faq-comprehensive` | Standard | High |
| 11 | `/features` | `features` | Standard | Medium |
| 12 | `/google-biz-optimizer` | `google-biz-optimizer` | Standard | Low |
| 13 | `/help` | `help` | Standard | Low |
| 14 | `/integrations` | `integrations` | Standard | Low |
| 15 | `/prompt-pages` | `prompt-pages` | Standard | Low |
| 16 | `/prompt-pages/settings` | `prompt-pages-settings` | Standard | Low |
| 17 | `/reviews` | `reviews` | Standard | Low |
| 18 | `/settings` | `settings` | Standard | Low |
| 19 | `/style-settings` | `style-settings` | Standard | Low |
| 20 | `/team` | `team` | Standard | Low |
| 21 | `/troubleshooting` | `troubleshooting` | Standard | Medium |
| 22 | `/widgets` | `widgets` | Standard | Low |

## Conversion Pattern

Each page conversion follows this pattern:

### 1. Extract Existing Content
From the current `page.tsx`:
- Title and description
- Keywords and metadata
- Category (label, icon, color)
- Available plans
- Key features array
- How it works steps
- Best practices
- FAQs (reference key or inline array)
- Call to action buttons
- Overview content (if JSX, convert to markdown)

### 2. Create CMS Article
POST to `/api/admin/help-content`:
```json
{
  "slug": "page-slug",
  "title": "Page Title",
  "content": "# Page Title\n\nContent.",
  "metadata": {
    "description": "...",
    "keywords": [],
    "canonical_url": "https://docs.promptreviews.app/path",
    "category_label": "Category",
    "category_icon": "IconName",
    "category_color": "color",
    "available_plans": ["grower", "builder", "maven"],
    "seo_title": "SEO Title",
    "seo_description": "SEO Description",
    "key_features": [...],
    "how_it_works": [...],
    "best_practices": [...],
    "overview_title": "Overview Title",
    "overview_markdown": "...",
    "call_to_action": {
      "primary": { "text": "...", "href": "..." }
    },
    "faqs": [...] // optional inline FAQs
  },
  "status": "published"
}
```

### 3. Update page.tsx
Replace with CMS pattern:
- Import `getArticleBySlug` from `@/lib/docs/articles`
- Implement `generateMetadata()` for SEO
- Fetch article in component
- Map metadata to component props
- Use `StandardOverviewLayout`
- Include icon resolution logic

## Completed Work

### Detailed Conversions (Ready to Use)

I've provided complete CMS article JSON for these pages:

1. **Advanced** (`/advanced`)
   - Slug: `advanced`
   - 6 key features
   - 4 how-it-works steps
   - 4 best practices
   - Custom overview with 3 cards
   - CTA: View Troubleshooting

2. **Analytics** (`/analytics`)
   - Slug: `analytics`
   - 4 key features
   - 3 how-it-works steps
   - 4 best practices
   - Uses pageFAQs['analytics']
   - CTA: Optimize Prompt Pages

3. **API** (`/api`)
   - Slug: `api`
   - 6 key features (with href anchors)
   - 4 how-it-works steps
   - 4 best practices
   - Complex overview with endpoint list and code examples
   - CTA: View API Reference

4. **API Reference** (`/api/reference`)
   - Slug: `api-reference`
   - **Special case**: Uses DocsLayout instead of StandardOverviewLayout
   - Contains highly structured endpoint documentation
   - Recommendation: Keep as static or create specialized component

5. **Billing** (`/billing`)
   - Slug: `billing`
   - 4 key features
   - 3 how-it-works steps
   - 4 best practices
   - Uses pageFAQs['billing']
   - CTA: Upgrade or Downgrade

## Migration Approaches

### Option A: Manual Conversion (Recommended)
**Why**: More control, better quality assurance, handles edge cases

**Process**:
1. Use the detailed JSON from `CMS_CONVERSION_GUIDE.md` for first 5 pages
2. Follow the same pattern for remaining pages
3. Test each page after conversion
4. Keep backups of original files

**Time Estimate**: 10-15 minutes per page = ~4-5 hours total

### Option B: Automated Script
**Why**: Faster, consistent, generates all files at once

**Limitations**:
- May not perfectly extract complex JSX content
- Requires manual review and fixes
- Won't handle special cases (like API Reference)

**Process**:
1. Set ADMIN_API_KEY environment variable
2. Run `node scripts/migrate-to-cms.mjs`
3. Review generated files
4. Fix any issues
5. Test all pages

**Time Estimate**: 1 hour for script execution + 2-3 hours for review/fixes

### Option C: Hybrid Approach (Best Balance)
**Process**:
1. Use manual conversion for complex pages (advanced, api, faq-comprehensive)
2. Use automated script for simple pages
3. Review and test everything

**Time Estimate**: ~3 hours total

## Special Considerations

### API Reference Page
The `/api/reference` page is fundamentally different:
- Uses `DocsLayout` instead of `StandardOverviewLayout`
- Contains structured endpoint documentation
- Has code examples and interactive elements

**Options**:
1. Keep as static page
2. Create specialized CMS component for API docs
3. Convert to markdown-heavy article

**Recommendation**: Discuss separately - may not fit standard pattern

### FAQ Pages
Both `/faq` and `/faq-comprehensive` contain many FAQs:
- Consider whether to store FAQs in CMS or keep in `pageFAQs`
- Inline FAQs in metadata makes CMS self-contained
- Reference to `pageFAQs` keeps FAQ data centralized

### Overview Content
Pages with complex JSX in overview sections:
- `/api` has endpoint lists and code blocks
- `/advanced` has comparison cards
- Convert to markdown where possible
- Use MarkdownRenderer component for display

## Testing Checklist

After each conversion:
- [ ] Page loads without errors
- [ ] Title and description display correctly
- [ ] All sections render (key features, how it works, best practices)
- [ ] FAQs appear
- [ ] Call-to-action buttons work
- [ ] Icons resolve correctly
- [ ] SEO metadata is correct
- [ ] Mobile responsive
- [ ] No console errors

## Rollback Plan

All original files should be backed up:
```bash
# Backup before conversion
cp src/app/path/page.tsx src/app/path/page.tsx.backup

# Rollback if needed
mv src/app/path/page.tsx.backup src/app/path/page.tsx
```

The migration script automatically creates `.backup` files.

## Next Steps

1. **Review this summary** and choose an approach (Manual, Automated, or Hybrid)

2. **Start with a test conversion**:
   - Convert `/analytics` first (simplest page)
   - Verify the pattern works
   - Adjust as needed

3. **Batch conversion**:
   - Group pages by complexity
   - Convert in batches of 5
   - Test each batch before proceeding

4. **Handle special cases**:
   - API Reference page requires discussion
   - FAQ pages may need special handling

5. **Final testing**:
   - Test all converted pages
   - Verify SEO metadata
   - Check mobile responsiveness
   - Ensure no broken links

## Success Criteria

- [ ] All 22 pages converted to CMS pattern
- [ ] All pages load without errors
- [ ] Content displays correctly
- [ ] SEO metadata is complete
- [ ] Icons resolve properly
- [ ] FAQs appear on all pages
- [ ] Call-to-action buttons work
- [ ] Mobile responsive
- [ ] Performance is acceptable
- [ ] Original files backed up

## Estimated Total Time

| Approach | Time |
|----------|------|
| Manual | 4-5 hours |
| Automated + Review | 3-4 hours |
| Hybrid | ~3 hours |

## Tools Provided

1. **CMS_CONVERSION_GUIDE.md**: Complete guide with examples
2. **scripts/migrate-to-cms.mjs**: Automated migration script
3. **CMS_CONVERSION_SUMMARY.md**: This summary document

## Questions to Resolve

1. Should API Reference page use a different approach?
2. Should FAQs be inline in CMS or reference `pageFAQs`?
3. What's the priority order for conversion?
4. Should all pages be converted at once or incrementally?
5. What's the testing/review process before deployment?

## Contact

For questions about the conversion pattern or tools, reference:
- Reference implementation: `/src/app/ai-reviews/page.tsx`
- Article fetching: `/src/lib/docs/articles.ts`
- Admin API: `/src/app/(app)/api/admin/help-content/route.ts`
