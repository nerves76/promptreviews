# Docs Site CMS Guide

Complete guide to how the Prompt Reviews documentation CMS works, how to edit content, and how the system is architected.

## Table of Contents

- [System Overview](#system-overview)
- [How Content Updates Work](#how-content-updates-work)
- [CMS Structure](#cms-structure)
- [Editing Content](#editing-content)
- [Icons System](#icons-system)
- [Maintenance Scripts](#maintenance-scripts)
- [Troubleshooting](#troubleshooting)

---

## System Overview

### Architecture

The docs site (`docs.promptreviews.app`) is a Next.js 14 application that pulls content from a Supabase PostgreSQL database. Key characteristics:

- **CMS Location**: `app.promptreviews.app/dashboard/help-content`
- **Database**: Supabase (`ltneloufqjktdplodvao.supabase.co`)
- **Table**: `articles`
- **Caching Strategy**: No caching - every page request fetches fresh data
- **Deployment**: Vercel with separate project for docs site

### Why No Caching?

Content accuracy is more important than speed for documentation. With no caching:
- ✅ CMS edits appear immediately (just refresh the page)
- ✅ No need to redeploy or clear caches
- ✅ Perfect for iterative editing
- ⚠️ Slightly slower page loads (~100-200ms to fetch from database)

---

## How Content Updates Work

### The Update Flow

```
1. Edit content in CMS
   ↓
2. Click "Save Changes"
   ↓
3. Content saved to Supabase database
   ↓
4. Refresh docs page
   ↓
5. Page fetches fresh data from database
   ↓
6. See changes immediately
```

### Technical Implementation

**File**: `/src/lib/docs/articles.ts`

```typescript
// Supabase client configured to bypass all caching
function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          cache: 'no-store'  // ← Forces fresh data every request
        })
      }
    }
  })
}
```

All page components use this client to fetch articles:
```typescript
const article = await getArticleBySlug('ai-reviews')
```

No ISR, no revalidation periods - just raw database queries on every page load.

---

## CMS Structure

### Database Table: `articles`

Each article has these key fields:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | uuid | Primary key |
| `slug` | text | URL identifier (e.g., `ai-reviews`) |
| `title` | text | Page title |
| `content` | text | Markdown content for overview section |
| `metadata` | jsonb | Structured data for features, best practices, etc. |
| `status` | text | `published`, `draft`, or `archived` |
| `updated_at` | timestamp | Last modification time |

### Content vs Metadata

**Critical distinction:** There are TWO places content lives:

#### 1. Content Field (Markdown)
**Purpose**: Overview/introduction text only

**What goes here:**
- Opening paragraph about the feature
- General context or explanation
- High-level description

**What does NOT go here:**
- ❌ Feature lists with emoji headings (### 📌 Feature Name)
- ❌ "Key Features" sections
- ❌ "How It Works" sections
- ❌ "Best Practices" sections

**Example** (`ai-reviews` content field):
```markdown
Our AI-powered system helps you create personalized, human-sounding
review requests that actually work—without losing the personal touch
that makes your business special.
```

That's it! Just the intro.

#### 2. Metadata Field (Structured JSON)
**Purpose**: All structured content with proper formatting

**Structure:**
```json
{
  "description": "SEO meta description",
  "seo_title": "SEO page title",
  "seo_description": "Alternative SEO description",
  "keywords": ["keyword1", "keyword2"],
  "category_label": "AI Features",
  "category_icon": "Sparkles",
  "category_color": "purple",
  "available_plans": ["grower", "builder", "maven"],

  "key_features": [
    {
      "icon": "Brain",
      "title": "Smart Personalization",
      "description": "AI analyzes your business..."
    }
  ],

  "how_it_works": [
    {
      "number": 1,
      "icon": "Users",
      "title": "Understand Your Business",
      "description": "AI learns about..."
    }
  ],

  "best_practices": [
    {
      "icon": "Heart",
      "title": "Keep It Personal",
      "description": "Use AI to enhance..."
    }
  ],

  "faqs": [
    {
      "question": "How does AI help?",
      "answer": "Our AI analyzes..."
    }
  ],

  "call_to_action": {
    "primary": {
      "text": "Learn More",
      "href": "/prompt-pages",
      "external": false
    },
    "secondary": {
      "text": "Contact Support",
      "href": "mailto:support@promptreviews.app",
      "external": true
    }
  }
}
```

---

## Editing Content

### Access the CMS

1. Navigate to: `https://app.promptreviews.app/dashboard/help-content`
2. Find the article you want to edit
3. Click "Edit"

### Editing Best Practices

#### ✅ DO:
- Write intro/overview text in the **Content** field (markdown)
- Use structured **Metadata** for features, steps, best practices
- Use Lucide icon names in metadata (not emojis)
- Save frequently - changes are immediate
- Preview the live page after saving

#### ❌ DON'T:
- Don't put feature lists in Content field
- Don't use emoji characters (📌🎯) in headings
- Don't duplicate content between Content and Metadata
- Don't worry about caching - it's disabled

### Metadata Editing Tips

**In the CMS interface:**
- Most metadata fields have JSON editors
- Arrays like `key_features` can be edited as structured data
- Test icon names before saving (see Icons section)
- Use the "Preview" feature if available

---

## Icons System

### How Icons Work

The docs site uses **Lucide React** for all icons. Icons are rendered as white SVG outlines.

### Available Icons

Common icons used in docs:

| Icon Name | Visual | Use Case |
|-----------|--------|----------|
| `Brain` | 🧠 | AI features |
| `Target` | 🎯 | Goals, targeting |
| `Wand2` | 🪄 | Magic, automation |
| `TrendingUp` | 📈 | Performance, analytics |
| `Shield` | 🛡️ | Security, safety |
| `Heart` | ❤️ | Personal touch |
| `Clock` | ⏰ | Timing, scheduling |
| `Users` | 👥 | Team, customers |
| `MessageSquare` | 💬 | Communication |
| `Star` | ⭐ | Quality, reviews |
| `Zap` | ⚡ | Speed, energy |
| `CheckCircle` | ✅ | Success, completion |

**Full list**: Browse https://lucide.dev/icons/

### Using Icons in Metadata

**Correct** (Lucide icon name):
```json
{
  "icon": "Brain",
  "title": "Smart AI"
}
```

**Incorrect** (emoji):
```json
{
  "icon": "🧠",
  "title": "Smart AI"
}
```

### Icon Resolution

The page components use `resolveIcon()` to handle icon names:

```typescript
function resolveIcon(iconName: string, fallback: LucideIcon): LucideIcon {
  // Tries multiple formats:
  // "Brain" → Works
  // "brain" → Works (case insensitive)
  // "BRAIN" → Works
  // "sparkles" → Works

  // Falls back to default icon if not found
  return Icons[iconName] || fallback
}
```

---

## Maintenance Scripts

All scripts located in `/scripts/` directory.

### Check Production CMS

**File**: `scripts/check-production-cms.ts`

View what's currently in the production database:

```bash
npx ts-node scripts/check-production-cms.ts
```

Shows: slug, title, content length, metadata structure

### Check All CMS Fields

**File**: `scripts/check-all-cms-fields.ts`

Deep inspection of a specific article:

```bash
npx ts-node scripts/check-all-cms-fields.ts
```

Shows: Full content, complete metadata, timestamps

### Clean Emoji Content

**File**: `scripts/clean-emoji-content.ts`

Removes duplicate feature sections and emoji headings from content field:

```bash
npx ts-node scripts/clean-emoji-content.ts
```

**What it does:**
- Scans all published articles
- Removes "## Key Features" sections from content (if in metadata)
- Removes "## How It Works" sections from content (if in metadata)
- Removes "## Best Practices" sections from content (if in metadata)
- Removes emoji headings (### 📌 Title)
- Updates database automatically

**When to use:**
- After importing content from old system
- When emojis appear in rendered pages
- When features appear twice (once in content, once in metadata)

### Fix Emoji Icons

**File**: `scripts/fix-emoji-icons.ts`

Converts emoji characters to Lucide icon names in metadata:

```bash
npx ts-node scripts/fix-emoji-icons.ts
```

**Mappings:**
- 🧠 → Brain
- 🎯 → Target
- 🪄 → Wand2
- 📈 → TrendingUp
- 🛡️ → Shield
- ❤️ → Heart
- ⏰ → Clock
- ⚡ → Zap

**When to use:**
- After bulk content import
- When colored emojis appear instead of white icons
- When migrating from old markdown-based system

---

## Troubleshooting

### Content Not Updating

**Symptom**: You save changes in CMS but don't see them on docs site

**Diagnosis:**
```bash
# Check what's actually in database
npx ts-node scripts/check-all-cms-fields.ts

# Check last updated timestamp
# If it's old, your save didn't work
```

**Solutions:**
1. **Browser cache**: Hard refresh with Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Check save confirmation**: Look for success message in CMS
3. **Verify database**: Use check script above to confirm data is there
4. **Check deployment**: Ensure docs site deployed successfully in Vercel

### Wrong Icons Displaying

**Symptom**: Seeing colored emojis instead of white SVG icons

**Cause**: Icons are in content field as emojis, or metadata has emoji characters

**Fix:**
```bash
# Clean content field
npx ts-node scripts/clean-emoji-content.ts

# Fix metadata icons
npx ts-node scripts/fix-emoji-icons.ts
```

### Duplicate Content

**Symptom**: Features appear twice - once with emojis, once with proper icons

**Cause**: Content field has feature list AND metadata has structured features

**Fix:**
```bash
# Removes duplicates from content field
npx ts-node scripts/clean-emoji-content.ts
```

Or manually edit the article and remove feature sections from Content field.

### Page Shows 404

**Symptom**: Article exists in CMS but page shows "Not Found"

**Causes:**
1. Article status is `draft` (only `published` articles show)
2. Slug doesn't match URL
3. Article in wrong database (local vs production)

**Fix:**
```bash
# Check article status and slug
npx ts-node scripts/check-production-cms.ts | grep your-slug
```

### Slow Page Loads

**Symptom**: Docs pages load slowly

**Cause**: Database query on every request (by design)

**Normal behavior:**
- First load: 200-300ms (database query)
- Subsequent loads: Same speed (no caching)

**Not a bug** - this is the trade-off for immediate content updates.

If page loads take >1 second consistently:
1. Check Supabase database performance
2. Check network latency
3. Consider re-enabling ISR for stable pages

---

## Development Workflow

### Local Development

```bash
# Start local dev server
npm run dev

# Points to production Supabase database
# Changes in CMS will appear immediately in local dev too
```

### Testing Changes

1. Edit in CMS
2. Save
3. Refresh local dev page or production page
4. Changes appear immediately

### Deploying Code Changes

```bash
# Commit changes
git add -A
git commit -m "Update docs system"
git push

# Vercel auto-deploys main branch
# Takes 2-3 minutes
```

CMS content changes don't require deployment - they're live immediately.

---

## Architecture Decisions

### Why No Caching?

**Decision**: Disable all Next.js caching (ISR, fetch cache, etc.)

**Reasoning:**
- Documentation needs to be accurate above all else
- Editors need immediate feedback
- Caching adds complexity (revalidation periods, cache tags, manual invalidation)
- Performance hit is acceptable (~100-200ms per page)
- Simpler mental model: "Save in CMS → refresh page → see changes"

**Trade-offs:**
- ✅ Immediate updates
- ✅ No cache invalidation logic needed
- ✅ Simpler debugging
- ❌ Slightly slower page loads
- ❌ More database queries

### Why Separate Content and Metadata?

**Decision**: Store intro text in `content`, structured data in `metadata`

**Reasoning:**
- Intro text benefits from markdown (bold, links, etc.)
- Structured data needs consistent formatting (icons, order, etc.)
- Separating allows different editing interfaces
- Metadata can be validated (icon names, required fields)
- Content can be free-form for flexibility

### Why Lucide Icons?

**Decision**: Use Lucide React library with icon names in metadata

**Reasoning:**
- Consistent visual style (all white outlines)
- 1000+ icons available
- Easy to change icons (just update name in CMS)
- SVG = crisp at any size
- No emoji rendering inconsistencies across browsers/devices

---

## Future Improvements

### Potential Enhancements

1. **Smart Caching**: Cache stable pages, no-cache for frequently edited ones
2. **CMS Preview**: Live preview in CMS before saving
3. **Icon Picker**: Visual icon selector in CMS metadata editor
4. **Content Versioning**: Track changes and allow rollbacks
5. **Markdown Editor**: WYSIWYG editor for content field
6. **Bulk Operations**: Update multiple articles at once
7. **Search Integration**: Full-text search across all docs

### Known Limitations

1. **No draft preview**: Can't preview drafts without publishing
2. **No content history**: Can't see previous versions
3. **Manual metadata editing**: JSON editing is error-prone
4. **No validation**: Bad icon names fail silently
5. **No relationships**: Can't easily link related articles

---

## Quick Reference

### Essential URLs

- **CMS**: https://app.promptreviews.app/dashboard/help-content
- **Docs Site**: https://docs.promptreviews.app
- **Icons List**: https://lucide.dev/icons/

### Common Commands

```bash
# Check production content
npx ts-node scripts/check-production-cms.ts

# Clean emoji content
npx ts-node scripts/clean-emoji-content.ts

# Fix emoji icons in metadata
npx ts-node scripts/fix-emoji-icons.ts

# Deploy
git push

# Local dev
npm run dev
```

### File Locations

- **CMS Client**: `/src/lib/docs/articles.ts`
- **Page Components**: `/src/app/*/page.tsx`
- **Scripts**: `/scripts/`
- **This Guide**: `/DOCS_CMS_GUIDE.md`

---

## Support

For questions or issues:
1. Check this guide first
2. Run diagnostic scripts
3. Check Vercel deployment logs
4. Review Supabase database directly
5. Check #engineering in Slack

**Last Updated**: 2025-10-06
