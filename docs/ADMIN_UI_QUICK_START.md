# Help Content Admin UI - Quick Start Guide

## 1. Access the Admin UI

**URL:** `https://app.promptreviews.app/dashboard/help-content`

**Requirements:**
- Must be logged in
- Must have admin privileges

If you see "Access Denied", contact a developer to grant admin access.

## 2. Creating Your First Article

### Step-by-Step

1. **Click "Create New Article"** (top right)

2. **Fill in basic information:**
   - **Title:** e.g., "How to Create Widgets"
   - **Slug:** Auto-generated (e.g., `how-to-create-widgets`)
   - **Category:** e.g., `features`
   - **Description:** Brief summary for search results

3. **Write your content:**
   - Use the markdown editor (toolbar has formatting buttons)
   - Click "Show Preview" to see how it looks
   - Content auto-saves every 30 seconds

4. **Publish:**
   - Click "Save Draft" to save without publishing
   - Click "Publish" to make it live

## 3. Editing Existing Articles

1. **Find the article:**
   - Use the search box to find by title
   - Or filter by status/category

2. **Click "Edit"**

3. **Make your changes:**
   - Edit any field
   - Auto-save protects your work

4. **Save:**
   - Click "Update & Publish" when done

## 4. Common Tasks

### Publishing a Draft
- In the article list, click "Publish" button
- Article goes live immediately

### Unpublishing an Article
- Click "Unpublish" button
- Article becomes a draft (not visible to users)

### Deleting an Article
- Click "Delete" button
- Click "Confirm" to permanently delete
- **Warning:** Cannot be undone!

## 5. Markdown Basics

### Headings
```markdown
# Main Heading (H1)
## Section Heading (H2)
### Subsection (H3)
```

### Text Formatting
```markdown
**Bold text**
*Italic text*
```

### Links
```markdown
[Link text](https://example.com)
```

### Lists
```markdown
- Bullet point
- Another point

1. Numbered item
2. Another item
```

### Images
```markdown
![Image description](https://example.com/image.png)
```

### Code
```markdown
`inline code`

\`\`\`
code block
multiple lines
\`\`\`
```

## 6. Tips & Tricks

### Auto-Save
- Saves automatically every 30 seconds
- Shows "Last saved" timestamp
- Only works after first save (not for new articles)

### Search & Filter
- **Search:** Type in search box (filters as you type)
- **Status:** Show only published/draft/archived
- **Category:** Filter by article category

### Preview Mode
- Click "Show Preview" for split-screen view
- Left: Editor, Right: Preview
- Click "Hide Preview" to go back

### Keyboard Shortcuts (in editor)
- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + K` - Insert link
- `F11` - Fullscreen mode

## 7. Article Organization

### Categories
Use consistent categories to organize content:
- `getting-started` - Onboarding and basics
- `features` - Feature explanations
- `guides` - How-to guides
- `troubleshooting` - Problem solving
- `advanced` - Advanced topics

### Slugs
- Auto-generated from title
- Cannot change after creation
- Keep short and descriptive
- Use hyphens for spaces

### Tags
- Add to metadata for better organization
- Comma-separated in "Advanced Metadata"
- Examples: `tutorial`, `setup`, `widget`

## 8. Common Mistakes to Avoid

### ❌ Don't
- Change slug after publishing (it breaks links)
- Delete articles without archiving first
- Publish without previewing
- Forget to add category/description
- Use inconsistent category names

### ✅ Do
- Preview before publishing
- Add descriptions for SEO
- Use consistent formatting
- Save drafts while working
- Archive instead of deleting

## 9. Troubleshooting

### "Access Denied"
**Solution:** You need admin privileges. Contact development team.

### "Slug already exists"
**Solution:** Choose a different slug. Each article needs a unique slug.

### Auto-save not working
**Solution:** Make sure title, slug, and content are filled in.

### Changes not appearing
**Solution:**
1. Check status is "published" (not draft)
2. Clear browser cache
3. Wait a few minutes for cache to update

## 10. Getting Help

### Resources
- **Full Documentation:** `/docs/ADMIN_UI_GUIDE.md`
- **Markdown Guide:** Click "Guide" button in editor toolbar
- **Support:** support@promptreviews.app

### Quick Checks
1. Is the article published? (Check status badge)
2. Did you save your changes? (Look for "Last saved" time)
3. Are you an admin? (Access denied error if not)

## Status Reference

- 🟢 **Published** - Live and visible to users
- 🟡 **Draft** - Saved but not visible to users
- ⚫ **Archived** - Removed from active use but not deleted

---

**Last Updated:** October 3, 2025
**Version:** 1.0
