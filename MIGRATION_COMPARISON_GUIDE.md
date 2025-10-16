# Migration Comparison Guide

## How to Compare Old vs New

After running the migration, both versions will be accessible for comparison.

### Accessing Both Versions

#### Old (Static) Pages
These continue to work at their current URLs:
- http://localhost:3001/prompt-pages/features/ai-powered
- http://localhost:3001/prompt-pages/features/qr-codes
- http://localhost:3001/billing/upgrades-downgrades
- etc.

#### New (CMS) Pages
Access via the `/docs/[slug]` route:
- http://localhost:3001/docs/prompt-pages/features/ai-powered
- http://localhost:3001/docs/prompt-pages/features/qr-codes
- http://localhost:3001/docs/billing/upgrades-downgrades
- etc.

### Side-by-Side Comparison

Open two browser windows:

**Window 1 (Old):**
```
http://localhost:3001/prompt-pages/features/ai-powered
```

**Window 2 (New):**
```
http://localhost:3001/docs/prompt-pages/features/ai-powered
```

### What to Check

Use this checklist for each page:

#### Visual Elements
- [ ] Header gradient and icon match
- [ ] Breadcrumbs display correctly
- [ ] Overview section identical
- [ ] "How It Works" steps match (numbers, icons, text)
- [ ] Key features grid matches (icons, titles, descriptions)
- [ ] Benefits section matches
- [ ] Best practices match
- [ ] "Perfect for" section matches
- [ ] Related features links work

#### Styling
- [ ] Multi-column grids (2-col, 3-col) match
- [ ] Card backgrounds and borders match
- [ ] Text colors match (white, white/80, white/70)
- [ ] Spacing and padding identical
- [ ] Icons display (emojis vs Lucide should be visually similar)

#### Content
- [ ] All text content identical
- [ ] No missing sections
- [ ] Links all work correctly
- [ ] No HTML artifacts in text

## Automated Comparison Script

I can also create a script that:
1. Takes screenshots of both versions
2. Highlights differences visually
3. Generates a comparison report

Would you like me to create this?

## Priority Pages to Test

Test these high-value pages first:

### Feature Pages (9)
1. AI-Powered Content
2. Emoji Feedback Flow
3. QR Code Generation
4. Customization
5. Analytics & Insights
6. Multi-Platform Sharing
7. Mobile Optimization
8. Security & Privacy
9. Platform Integration

### Other Important Pages
- Getting Started
- Prompt Pages Overview
- Billing & Plans
- Upgrades/Downgrades
- Google Business Profile
- Widgets

## Known Differences (Expected)

These are intentional differences that are OK:

### Icons
- **Old**: Lucide React components (SVG)
- **New**: Emoji equivalents
- **Why**: Emojis are easier to edit in markdown, visually similar

Example:
- Old: `<QrCode className="w-5 h-5" />` (SVG icon)
- New: `📱` (emoji)

### Breadcrumbs
- **Old**: May vary by page
- **New**: Consistent "Home > [category] > [page]" format

### Related Articles
- **Old**: Hardcoded links
- **New**: Database-driven, may show different but relevant articles

## Reporting Issues

If you find discrepancies:

### Visual Differences
1. Take screenshots of both versions
2. Note the URL and specific section
3. Describe what's different

### Content Differences
1. Copy the text from both versions
2. Note which section (e.g., "How It Works step 2")
3. Highlight what's missing or changed

### Styling Issues
1. Note the section (e.g., "Key benefits grid")
2. Describe the visual difference
3. Browser and screen size

## Testing Workflow

Recommended approach:

### Phase 1: Spot Check (5 minutes)
1. Open 3 random pages side-by-side
2. Verify they look identical
3. Check one from each category (features, getting started, billing)

### Phase 2: Feature Pages (20 minutes)
1. Test all 9 feature pages systematically
2. Use the checklist above
3. Note any issues

### Phase 3: Other Pages (15 minutes)
1. Test main category pages
2. Test sub-pages
3. Verify contextual help works

### Phase 4: Final Verification (10 minutes)
1. Test help modal in app
2. Verify articles load correctly
3. Check that featured articles appear

## Rollback Plan

If significant issues are found:

### Option 1: Fix in Database
1. Edit articles in admin UI
2. Update metadata to fix rendering
3. No code changes needed

### Option 2: Re-run Migration
1. Fix the migration script
2. Re-run: `npx ts-node scripts/migrate-static-docs-to-cms-enhanced.ts`
3. Script updates existing articles

### Option 3: Rollback Completely
```sql
DELETE FROM articles WHERE created_at > '2025-10-04';
DELETE FROM article_contexts WHERE created_at > '2025-10-04';
```

Static pages continue working - zero downtime.

## After Approval

Once comparison looks good:

### Option A: Keep Both (Recommended Initially)
- Static pages remain as backup
- Route everything through CMS
- Safe transition period

### Option B: Remove Static Files
- Delete static `.tsx` files
- CMS is the single source of truth
- Cleaner codebase

## Quality Assurance Checklist

Before going live:

- [ ] All 57 pages migrated successfully
- [ ] Spot-checked 10+ pages side-by-side
- [ ] All feature pages verified
- [ ] Help modal works correctly
- [ ] Contextual help shows right articles
- [ ] Admin UI can edit articles
- [ ] No broken links
- [ ] No missing images/icons
- [ ] Mobile responsive on both versions
- [ ] Performance is acceptable

---

**Status**: Ready for comparison testing
**Both versions accessible**: Yes
**Rollback available**: Yes
**Zero downtime**: Yes
