# Help Content Admin UI - User Guide

## Overview

The Help Content Admin UI is a comprehensive content management system for creating, editing, and managing documentation articles. It provides a powerful markdown editor with live preview, auto-save functionality, and full control over article metadata.

**Access:** Only users with admin privileges can access this interface.

## Getting Started

### Accessing the Admin UI

1. Navigate to `/dashboard/help-content` in your browser
2. You must be logged in with an admin account
3. If you don't have admin privileges, you'll see an "Access Denied" message

### Admin Permission Requirements

Admin access is controlled by the `is_admin` column in the `users` table. To grant admin access:

```sql
UPDATE users SET is_admin = true WHERE id = '<user_id>';
```

## Features

### 1. Article List Page (`/dashboard/help-content`)

The main dashboard shows all articles with filtering and search capabilities.

#### Statistics Dashboard
- **Total Articles:** Count of all articles
- **Published:** Number of live articles
- **Drafts:** Number of unpublished articles
- **Archived:** Number of archived articles

#### Filtering Options
- **Search:** Filter by title or slug (searches as you type with 300ms debounce)
- **Status Filter:** Show all, published, draft, or archived articles
- **Category Filter:** Filter by article category

#### Article Actions
- **Edit:** Open the article editor
- **Publish/Unpublish:** Toggle article status between published and draft
- **Delete:** Remove article (requires confirmation)
- **Create New:** Button to create a new article

### 2. Article Editor (`/dashboard/help-content/[slug]/edit`)

#### Creating a New Article

1. Click "Create New Article" button
2. Fill in required fields:
   - **Title:** The article heading (required)
   - **Slug:** URL-friendly identifier (auto-generated from title)
   - **Content:** Markdown content (required)
3. Click "Save Draft" or "Publish"

#### Editing an Existing Article

1. Click "Edit" on any article in the list
2. Make your changes
3. Changes auto-save every 30 seconds if the article already exists
4. Click "Save Draft" or "Update & Publish" when done

#### Field Descriptions

##### Basic Fields

- **Title** (required)
  - The main heading of the article
  - Used to auto-generate the slug for new articles
  - Example: "Getting Started with Widgets"

- **Slug** (required)
  - URL-friendly identifier
  - Must be lowercase, alphanumeric, with hyphens
  - Cannot be changed after article creation
  - Example: `getting-started-with-widgets`

- **Category**
  - Organizes articles into groups
  - Examples: `getting-started`, `features`, `troubleshooting`

- **Description**
  - Brief summary for SEO and previews
  - Recommended: 150-160 characters

##### Content Editor

The markdown editor provides:
- **Syntax Highlighting:** Visual markdown formatting
- **Toolbar:** Quick access to common formatting
- **Live Preview:** Split-screen view of rendered content
- **Auto-save:** Saves drafts every 30 seconds
- **Full-screen Mode:** Distraction-free editing

##### Advanced Metadata (Optional)

Click "Show Advanced Metadata" to access:

- **Keywords:** Comma-separated list for SEO
- **Tags:** Article categorization tags
- **Category Label:** Display name for category
- **Category Icon:** Icon name (e.g., `BookOpen`)
- **Category Color:** Hex color code (e.g., `#452F9F`)

#### Editor Features

##### Auto-Save
- Automatically saves drafts every 30 seconds
- Only saves if required fields are filled
- Shows "Last saved" timestamp
- Displays "Auto-saving..." indicator

##### Unsaved Changes Warning
- Warns before leaving page with unsaved changes
- Shows "You have unsaved changes" message
- Browser prevents accidental navigation

##### Markdown Preview
- Click "Show Preview" to enable split-screen view
- Left side: Markdown editor
- Right side: Live preview of rendered content
- Click "Hide Preview" to return to full-width editor

##### Slug Validation
- Auto-generated from title for new articles
- Must follow pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Cannot be changed after creation
- Prevents duplicate slugs

### 3. Markdown Editor

#### Toolbar Features

- **Bold:** `**text**`
- **Italic:** `*text*`
- **Heading:** `# Heading`
- **Quote:** `> quote`
- **Unordered List:** `- item`
- **Ordered List:** `1. item`
- **Link:** `[text](url)`
- **Image:** `![alt](url)`
- **Code:** `` `code` ``
- **Table:** Create markdown tables
- **Preview:** Toggle preview mode
- **Side-by-Side:** Split screen view
- **Fullscreen:** Distraction-free mode
- **Guide:** Markdown syntax help

#### Markdown Quick Reference

```markdown
# Heading 1
## Heading 2
### Heading 3

**bold text**
*italic text*

[link text](https://example.com)
![image alt](https://example.com/image.png)

- Unordered list item
- Another item

1. Ordered list item
2. Another item

> Blockquote text

`inline code`

\`\`\`
code block
\`\`\`
```

## Workflows

### Publishing a New Article

1. Go to `/dashboard/help-content`
2. Click "Create New Article"
3. Enter title (slug auto-generates)
4. Write content in markdown
5. Add category and description
6. Click "Publish"

### Updating an Existing Article

1. Find article in list (use search/filters)
2. Click "Edit"
3. Make changes
4. Wait for auto-save or click "Update & Publish"

### Unpublishing an Article

1. In article list, click "Unpublish" button
2. Article status changes to "draft"
3. Article no longer visible to public

### Deleting an Article

1. Click "Delete" button on article
2. Click "Confirm" to verify deletion
3. Article permanently removed
4. **Warning:** This action cannot be undone

## API Endpoints

The Admin UI uses these API endpoints:

### GET `/api/admin/help-content`
List all articles with optional filters

**Query Parameters:**
- `status`: Filter by status (all, published, draft, archived)
- `category`: Filter by category
- `search`: Search in title and slug

**Response:**
```json
{
  "articles": [...],
  "stats": {
    "total": 10,
    "published": 7,
    "draft": 2,
    "archived": 1
  }
}
```

### POST `/api/admin/help-content`
Create a new article

**Request Body:**
```json
{
  "title": "Article Title",
  "slug": "article-slug",
  "content": "# Markdown content",
  "status": "draft",
  "metadata": {
    "description": "Brief description",
    "category": "getting-started",
    "keywords": ["help", "docs"]
  }
}
```

### GET `/api/admin/help-content/[slug]`
Get a single article (including drafts)

### PUT `/api/admin/help-content/[slug]`
Update an existing article

**Request Body:** Same as POST (partial updates supported)

### DELETE `/api/admin/help-content/[slug]`
Delete an article permanently

## Database Schema

### Articles Table

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Metadata JSONB Structure

```json
{
  "description": "Article description for SEO",
  "keywords": ["keyword1", "keyword2"],
  "category": "getting-started",
  "tags": ["tutorial", "setup"],
  "category_label": "Getting Started",
  "category_icon": "BookOpen",
  "category_color": "#452F9F",
  "available_plans": ["grower", "builder", "maven"]
}
```

## Permissions

### Admin Access
- Controlled by `is_admin` field in `users` table
- Checked on every API request
- Non-admin users see "Access Denied" message

### Security
- All API endpoints require admin authentication
- Uses Supabase service role for database operations
- Session validated on each request

## Best Practices

### Writing Content

1. **Use Descriptive Titles:** Clear, searchable headings
2. **Keep Slugs Short:** Use hyphens, lowercase only
3. **Add Descriptions:** Help users find content
4. **Categorize Properly:** Organize related articles
5. **Preview Before Publishing:** Use live preview

### Managing Articles

1. **Draft First:** Create as draft, review, then publish
2. **Use Auto-Save:** Don't worry about losing work
3. **Search & Filter:** Find articles quickly
4. **Regular Updates:** Keep content current
5. **Archive Old Content:** Don't delete, archive instead

### Markdown Tips

1. **Use Headings:** Structure content with H2, H3
2. **Add Links:** Reference related articles
3. **Include Images:** Visual aids improve understanding
4. **Code Blocks:** Use for technical examples
5. **Lists:** Break up long paragraphs

## Troubleshooting

### "Access Denied" Error
- **Cause:** User doesn't have admin privileges
- **Solution:** Update user's `is_admin` field to `true`

### "Slug Already Exists" Error
- **Cause:** Another article has the same slug
- **Solution:** Choose a different, unique slug

### Auto-Save Not Working
- **Cause:** Missing required fields (title, slug, content)
- **Solution:** Fill in all required fields

### Changes Not Saving
- **Cause:** Network error or API failure
- **Solution:** Check browser console for errors

### Preview Not Updating
- **Cause:** Markdown syntax error
- **Solution:** Check markdown syntax, fix errors

## Technical Details

### File Structure

```
src/
├── app/(app)/
│   ├── api/admin/help-content/
│   │   ├── route.ts              # GET, POST endpoints
│   │   └── [slug]/route.ts       # GET, PUT, DELETE endpoints
│   └── dashboard/help-content/
│       ├── page.tsx               # Article list page
│       ├── [slug]/edit/page.tsx   # Article editor
│       └── components/
│           └── MarkdownEditor.tsx # Markdown editor component
└── lib/
    └── admin/
        └── permissions.ts         # Admin permission checks
```

### Dependencies

- `react-simplemde-editor` - Markdown editor
- `easymde` - SimpleMDE core
- `react-markdown` - Markdown rendering
- `remark-gfm` - GitHub Flavored Markdown support

### Auto-Save Implementation

```typescript
// Auto-save every 30 seconds
const AUTOSAVE_INTERVAL = 30000;

useEffect(() => {
  if (hasUnsavedChanges && !isNewArticle) {
    const timer = setTimeout(() => {
      handleAutoSave();
    }, AUTOSAVE_INTERVAL);

    return () => clearTimeout(timer);
  }
}, [hasUnsavedChanges, article]);
```

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Contact development team

## Version History

- **v1.0** (2025-10-03) - Initial release
  - Article list with search and filters
  - Markdown editor with live preview
  - Auto-save functionality
  - Full CRUD operations
  - Admin permission controls
