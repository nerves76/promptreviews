# Help Content Admin UI

A comprehensive content management system for managing documentation articles.

## Overview

This admin interface allows content team members to create, edit, and manage help articles using a powerful markdown editor with live preview and auto-save functionality.

## Features

- **Article Management:** Full CRUD operations for help articles
- **Markdown Editor:** Rich text editing with syntax highlighting
- **Live Preview:** Split-screen markdown preview
- **Auto-Save:** Automatic draft saving every 30 seconds
- **Search & Filter:** Find articles by title, status, or category
- **Status Management:** Publish, unpublish, or archive articles
- **Metadata Editor:** Control SEO, categories, and article settings
- **Admin-Only Access:** Secure, permission-controlled interface

## Quick Links

- **Article List:** `/dashboard/help-content`
- **Create Article:** `/dashboard/help-content/new`
- **Edit Article:** `/dashboard/help-content/[slug]/edit`

## Documentation

- **Full Guide:** `/docs/ADMIN_UI_GUIDE.md`
- **Quick Start:** `/docs/ADMIN_UI_QUICK_START.md`

## File Structure

```
src/app/(app)/dashboard/help-content/
├── page.tsx                    # Article list page
├── [slug]/edit/page.tsx        # Article editor
├── components/
│   └── MarkdownEditor.tsx      # Markdown editor component
└── README.md                   # This file

src/app/(app)/api/admin/help-content/
├── route.ts                    # GET (list), POST (create)
└── [slug]/route.ts            # GET, PUT, DELETE individual articles

src/lib/admin/
└── permissions.ts              # Admin permission checks

src/lib/docs/
└── articles.ts                 # Article fetching utilities
```

## Tech Stack

- **Framework:** Next.js 15 App Router
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Editor:** SimpleMDE (react-simplemde-editor)
- **Preview:** React Markdown with GitHub Flavored Markdown
- **Styling:** Tailwind CSS

## API Endpoints

### List Articles
```
GET /api/admin/help-content?status=published&category=features&search=widget
```

### Create Article
```
POST /api/admin/help-content
Body: { title, slug, content, status, metadata }
```

### Get Article
```
GET /api/admin/help-content/[slug]
```

### Update Article
```
PUT /api/admin/help-content/[slug]
Body: { title, content, status, metadata, ... }
```

### Delete Article
```
DELETE /api/admin/help-content/[slug]
```

## Database Schema

### articles table
```sql
- id: UUID
- slug: TEXT (unique)
- title: TEXT
- content: TEXT
- metadata: JSONB
- status: TEXT (draft|published|archived)
- published_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Permissions

Access is controlled by the `is_admin` field in the `users` table:

```sql
-- Grant admin access
UPDATE users SET is_admin = true WHERE id = '<user_id>';

-- Revoke admin access
UPDATE users SET is_admin = false WHERE id = '<user_id>';
```

## Usage Examples

### Create a New Article

1. Navigate to `/dashboard/help-content`
2. Click "Create New Article"
3. Fill in title, slug, and content
4. Click "Publish" or "Save Draft"

### Edit an Article

1. Find article in list (use search/filters)
2. Click "Edit"
3. Make changes (auto-saves every 30s)
4. Click "Update & Publish"

### Manage Article Status

- **Publish:** Changes status to "published" and sets published_at
- **Unpublish:** Changes status to "draft" and clears published_at
- **Archive:** Changes status to "archived"

## Development

### Adding Features

To add new features to the admin UI:

1. **API Changes:** Update `/api/admin/help-content/` routes
2. **UI Changes:** Update components in `/dashboard/help-content/`
3. **Database Changes:** Update schema and migrations
4. **Documentation:** Update guides in `/docs/`

### Testing

```bash
# Start development server
npm run dev

# Navigate to admin UI
open http://localhost:3002/dashboard/help-content

# Test with admin user
# (Make sure your test user has is_admin = true)
```

## Security Notes

- All admin endpoints verify admin status via `requireAdminAccess()`
- Uses Supabase service role key for database operations
- Session validation on every request
- Non-admin users cannot access any admin endpoints or UI

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3002
lsof -ti:3002 | xargs kill -9
```

### Admin Access Issues
```sql
-- Check if user is admin
SELECT id, email, is_admin FROM users WHERE id = '<user_id>';

-- Grant admin if needed
UPDATE users SET is_admin = true WHERE id = '<user_id>';
```

### Auto-save Not Working
- Ensure title, slug, and content are filled
- Check browser console for errors
- Verify network connectivity

## Support

For issues or questions:
- **Documentation:** `/docs/ADMIN_UI_GUIDE.md`
- **Email:** support@promptreviews.app

## Version History

- **v1.0** (2025-10-03)
  - Initial release
  - Full article CRUD operations
  - Markdown editor with live preview
  - Auto-save functionality
  - Search and filter capabilities
  - Admin permission controls

## License

Proprietary - PromptReviews 2025
