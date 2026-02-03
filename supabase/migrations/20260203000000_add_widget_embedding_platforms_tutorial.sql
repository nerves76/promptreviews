-- ============================================================================
-- WIDGET EMBEDDING TUTORIAL: PLATFORM-SPECIFIC GUIDE
-- Provides step-by-step instructions for embedding widgets on different platforms
-- Created: 2026-02-03
-- ============================================================================

-- Insert the help article
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'widgets/embed-on-your-platform',
  'How to embed your widget on different platforms',
  '# How to embed your widget on different platforms

Once you''ve created and customized your review widget, you need to add the embed code to your website. The process varies depending on which website platform you use.

## Getting your embed code

1. Go to **Widgets** in your dashboard
2. Select the widget you want to embed
3. Click the **code icon** (</>) to copy your embed code
4. Your code will look something like this:

```html
<script src="https://app.promptreviews.app/widgets/multi/widget-embed.min.js"></script>
<div id="promptreviews-multi-widget" data-widget-id="your-widget-id"></div>
```

Now follow the instructions for your specific platform below.

---

## WordPress

WordPress doesn''t allow `<script>` tags directly in pages or posts for security reasons. You''ll need to use a plugin.

### Recommended: WPCode plugin (free)

1. Install the **WPCode** plugin from Plugins → Add New
2. Activate the plugin
3. Go to **Code Snippets → Add Snippet**
4. Click **Add Your Custom Code (New Snippet)**
5. Name it something like "Prompt Reviews Widget"
6. Set the code type to **HTML Snippet**
7. Paste your full embed code
8. Under **Insertion**, choose one of these:
   - **Site Wide Footer** - widget appears on all pages
   - **Shortcode** - creates a shortcode you can place anywhere
9. Save and activate the snippet

If you chose **Shortcode**, you''ll get a shortcode like `[wpcode id="123"]` that you can add to any page or post.

### Alternative: Theme editor

If you only need the widget on one page (like your homepage):

1. Go to **Appearance → Theme Editor**
2. Find your page template (e.g., `page-home.php`)
3. Paste the embed code where you want the widget
4. Save changes

**Note:** Theme editor changes may be lost when your theme updates. WPCode is the safer option.

---

## Wix

1. In the Wix Editor, click **Add Elements** (+)
2. Go to **Embed Code → Embed HTML**
3. Drag the HTML element to your desired location
4. Click **Enter Code**
5. Paste your full embed code
6. Click **Apply**
7. Resize the element as needed
8. **Publish** your site

**Tip:** Wix may add padding around the widget. Use the element''s design settings to adjust margins.

---

## Squarespace

### Using a Code Block

1. Edit the page where you want the widget
2. Click **Add Block** (+)
3. Select **Code** under "More"
4. Paste your full embed code
5. Set the display mode to **HTML**
6. Click outside the block to save
7. **Save** and publish your page

### Site-wide (footer)

To add the widget across all pages:

1. Go to **Settings → Advanced → Code Injection**
2. Paste your embed code in the **Footer** section
3. Click **Save**

---

## Shopify

### On a specific page

1. Go to **Online Store → Pages**
2. Select the page (or create a new one)
3. In the content editor, click **Show HTML** (</>)
4. Paste your embed code
5. Click **Save**

### In your theme

For more control over placement:

1. Go to **Online Store → Themes**
2. Click **Actions → Edit code**
3. Find the template you want to edit (e.g., `templates/page.liquid`)
4. Paste your embed code where you want the widget
5. Click **Save**

### Using a section

For homepage or product pages:

1. Go to **Online Store → Themes → Customize**
2. Click **Add section → Custom Liquid** (or Custom HTML if available)
3. Paste your embed code
4. Position the section using drag and drop
5. Click **Save**

---

## Webflow

1. In the Webflow Designer, select where you want the widget
2. Press **A** to add an element
3. Choose **Embed** from the Components section
4. Paste your full embed code
5. Click **Save & Close**
6. **Publish** your site

**Note:** The widget won''t render in the Designer preview. Publish or preview in the browser to see it.

---

## Framer

1. Open your Framer project
2. Click **Insert** (+) then **Code**
3. Select **Embed**
4. Paste your embed code
5. Resize and position as needed
6. **Publish** your site

---

## Weebly / Square Online

1. Drag an **Embed Code** element to your page
2. Click **Edit Custom HTML**
3. Paste your full embed code
4. Click outside to save
5. **Publish** your site

---

## GoDaddy Website Builder

1. Edit your page
2. Click **Add Section → HTML**
3. Paste your embed code
4. Click **Done**
5. **Publish**

---

## Custom HTML / Self-hosted sites

If you manage your own HTML:

1. Open your HTML file
2. Paste the embed code where you want the widget to appear
3. The `<script>` tag should be included once per page (typically near the bottom)
4. Upload/deploy your changes

---

## Troubleshooting

### Widget not appearing

- **Check for script blockers** - Browser extensions or your platform''s security settings might block external scripts
- **Verify the code is complete** - Make sure you copied both the `<script>` and `<div>` parts
- **Check your plan** - Widgets require the Builder plan or higher

### Widget looks wrong

- **Clear your cache** - Your browser or CDN might be caching old styles
- **Check container width** - The widget adapts to its container; make sure it has enough width
- **Review your customization** - Go back to the widget editor and verify your style settings

### "Script not allowed" errors

Some platforms restrict scripts for security. Try:
- Using the platform''s native HTML/Embed block instead of the text editor
- Using a plugin (like WPCode for WordPress)
- Contacting your platform''s support about allowing external scripts

---

## Need more help?

If you''re having trouble embedding on a platform not listed here, contact us at support@promptreviews.app with:
- Your website platform
- The error message (if any)
- A screenshot of what you''re seeing

We''re happy to help you get your widget live!',
  'published',
  '{
    "category": "widgets",
    "category_label": "Widgets",
    "category_icon": "Code",
    "category_color": "blue",
    "description": "Step-by-step instructions for embedding your review widget on WordPress, Wix, Squarespace, Shopify, Webflow, and other platforms.",
    "keywords": ["embed", "widget", "install", "wordpress", "wix", "squarespace", "shopify", "webflow", "framer", "weebly", "godaddy", "wpcode", "html", "script"],
    "tags": ["embed", "installation", "platforms", "wordpress", "wix", "squarespace", "shopify"],
    "available_plans": ["grower", "builder", "maven", "enterprise"],
    "seo_title": "How to Embed Your Review Widget on Different Platforms - Prompt Reviews Help",
    "seo_description": "Learn how to embed your Prompt Reviews widget on WordPress (using WPCode), Wix, Squarespace, Shopify, Webflow, and other website builders."
  }'::jsonb,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Add to navigation under Widgets category
DO $$
DECLARE
  parent_uuid uuid;
BEGIN
  -- Find or create the Widgets parent navigation item
  SELECT id INTO parent_uuid
  FROM navigation
  WHERE title = 'Widgets' OR href = '/widgets'
  LIMIT 1;

  -- If no Widgets parent exists, create one
  IF parent_uuid IS NULL THEN
    INSERT INTO navigation (title, href, icon_name, order_index, visibility, is_active)
    VALUES (
      'Widgets',
      '/widgets',
      'Code',
      40,
      ARRAY['docs', 'help'],
      true
    )
    RETURNING id INTO parent_uuid;
  END IF;

  -- Insert the embedding tutorial navigation entry
  INSERT INTO navigation (parent_id, title, href, icon_name, order_index, visibility, is_active)
  VALUES (
    parent_uuid,
    'Embed on your platform',
    '/widgets/embed-on-your-platform',
    'Globe',
    20,
    ARRAY['docs', 'help'],
    true
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Add article context for the widgets page so it shows up as contextual help
INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT
  a.id,
  '/dashboard/widget',
  ARRAY['widget', 'embed', 'install', 'code', 'wordpress', 'wix', 'squarespace', 'shopify', 'webflow'],
  85
FROM articles a
WHERE a.slug = 'widgets/embed-on-your-platform'
ON CONFLICT DO NOTHING;
