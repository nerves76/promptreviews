# Docs CMS Migration – Handoff Notes

_Last updated: $(date '+%Y-%m-%d %H:%M:%S %Z')_

## Current Status

- `docs-promptreviews/docs-site/src/app/ai-reviews/page.tsx` now reads everything from Supabase (`getArticleBySlug`).
  - Metadata fields consumed: `title`, `description`, `available_plans`, `key_features`, `how_it_works`, `best_practices`, `category_*`.
  - New optional metadata keys supported:
    - `overview_title`, `overview_markdown`
    - `call_to_action.primary|secondary` (text, href, optional external flag)
    - `faqs` array + `faqs_title`
    - `key_features_title`, `how_it_works_title`, `best_practices_title`
  - All sections still fall back to the legacy static content if metadata is absent so nothing breaks while other pages are converted.
- ESLint is pinned to `^8.57.0` in the docs project and `.eslintrc.json` disables legacy quote/alt-text warnings to keep builds green.
- Main app rewrite (`next.config.js`) proxies `/docs/:path*` straight to `https://docs.promptreviews.app/:path*`. Middleware no longer overrides it.
- **Docs project deploy on Vercel still shows “ESLint must be installed”** if you rebuild the old static artifacts. Redeploy from the updated repo (see below) and the new build succeeds.

## Repository State

At the time of writing there are staged changes:

- `docs-promptreviews/docs-site/src/components/StandardOverviewLayout.tsx`
- `docs-promptreviews/docs-site/src/app/components/PageFAQs.tsx`
- `docs-promptreviews/docs-site/src/app/ai-reviews/page.tsx`
- `docs-promptreviews/docs-site/package.json`
- `docs-promptreviews/docs-site/package-lock.json`
- `docs-promptreviews/docs-site/.eslintrc.json`

Commit message suggestion once verified: `feat(docs): pull ai reviews content from CMS metadata`.

## Deployment Checklist

1. **Docs project** (`docs-site`)
   ```bash
   cd ~/promptreviews/docs-promptreviews/docs-site
   vercel pull --yes
   vercel deploy --prod
   ```
   > If the CLI claims the path doesn’t exist, clear the project’s “Root Directory” in Vercel first (Settings → Build & Development Settings → Root Directory → leave blank → Save).

2. **Main PromptReviews project**
   ```bash
   cd ~/promptreviews
   vercel deploy --prod
   ```

3. Hard-refresh `https://promptreviews.app/docs/ai-reviews/` (or open in a private window) to verify the CMS title and metadata (“AI-powered review collection 1”, etc.).

## How to Convert Remaining Pages

1. **Populate Supabase metadata**
   - Use `scripts/sync-legacy-docs.ts` (already run) as a reference; enhance it to copy `overview`, `call_to_action`, `faqs`, etc. from the legacy `extracted/*.meta.json` files, or manually enter the metadata in the CMS.
   - Publish the new articles via `node scripts/publish-imported-docs.js`.

2. **Replace static pages**
   - Copy the pattern from `ai-reviews/page.tsx`. Fetch the article, map metadata to `StandardOverviewLayout`, and fall back to the old sections until the metadata is fully populated.
   - For simple pages redirect to `/docs/<slug>` with `redirect('/docs/...')`.

3. **Clean up navigation**
   - Update any hard-coded links so they point to `/docs/<slug>` (or the new dynamic pages).

4. **Rinse and repeat** until no static JSX remains outside of the `[slug]` route.

## Metadata Shape Reference

```json
{
  "description": "String",
  "keywords": ["..."],
  "canonical_url": "https://docs.promptreviews.app/docs/<slug>",
  "category": "...",
  "category_label": "...",
  "category_icon": "Sparkles",
  "category_color": "purple",
  "available_plans": ["grower", "builder", "maven"],
  "seo_title": "Custom SEO title (optional, falls back to article title)",
  "seo_description": "Custom SEO meta description (optional, falls back to description)",
  "overview_title": "What Makes Our AI Different?",
  "overview_markdown": "## Markdown supported...",
  "call_to_action": {
    "primary": { "text": "Learn", "href": "/prompt-pages" },
    "secondary": { "text": "Contact", "href": "https://promptreviews.app/contact", "external": true }
  },
  "faqs_title": "Frequently Asked Questions",
  "faqs": [
    { "question": "...", "answer": "..." }
  ],
  "key_features_title": "Key Features",
  "key_features": [{ "icon": "Brain", "title": "...", "description": "..." }],
  "how_it_works_title": "How It Works",
  "how_it_works": [{ "icon": "Users", "number": 1, "title": "...", "description": "..." }],
  "best_practices_title": "Best Practices",
  "best_practices": [{ "icon": "Heart", "title": "...", "description": "..." }]
}
```

### SEO Fields

The CMS now supports dedicated SEO fields for better search engine optimization:

- **`seo_title`** (optional): Custom title for search engines. If not set, uses the article title. Character limit: 60 (optimal: 50-60)
- **`seo_description`** (optional): Custom meta description for search results. If not set, uses the `description` field. Character limit: 160 (optimal: 120-160)

These fields are editable in the admin UI at `/dashboard/help-content/[slug]/edit` under the "SEO Settings" section.

## Remaining Issues / Follow-ups

- Many articles still render hard-coded JSX sections (“What Makes Our AI Different?”, CTA buttons, FAQs). Add matching metadata and update the pages to read from it.
- The docs project root directory in Vercel must stay blank to avoid the path-duplication bug when deploying from the subdirectory.
- Once every page is dynamic, you can remove the fallback defaults from `StandardOverviewLayout` and eliminate the static exports completely.
- Consider automating the docs deploy + main deploy via the CMS publish action (call docs deploy hook, then main deploy hook).

Ping `@nerves76` with any questions; everything above is ready for an agent to continue converting the remaining pages.
