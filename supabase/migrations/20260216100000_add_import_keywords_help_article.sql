-- ============================================================================
-- IMPORT KEYWORDS CONCEPTS HELP ARTICLE
-- Provides a tutorial for importing keyword concepts via CSV
-- Created: 2026-01-18
-- ============================================================================

-- Insert the help article
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'keywords/import-concepts',
  'How to import keyword concepts',
  '# How to import keyword concepts

Import your keyword concepts in bulk using a CSV file. This is the fastest way to populate your keyword library when you have many concepts to add.

## Before you start

Before importing, make sure you have:
- A CSV file with your keywords (you can download our template from the import modal)
- Your keywords organized by concept name
- Optional: keyword groups already created (or they''ll be created automatically)

## Downloading the template

1. Go to **Keywords** in your dashboard
2. Click the **Import** button
3. Click **Download template** to get a pre-formatted CSV
4. The template includes example data and your existing groups

## CSV columns explained

Your CSV file should have a header row with these columns:

### Required column

| Column | Description |
|--------|-------------|
| **concept_name** | The main concept name that appears in your library. This is the primary identifier for the keyword concept. Example: "portland plumber" |

### Optional columns

| Column | Description |
|--------|-------------|
| **concept_group** | Group name for organizing concepts. If the group doesn''t exist, it will be created automatically. Example: "Services" |
| **review_phrase** | How customers might mention this concept in reviews. Used for matching keywords in customer feedback. Example: "great plumbing services" |
| **aliases** | Alternative names for this concept, separated by pipes `\|` or commas. Helps with broader matching. Example: "plumber\|plumbing" |
| **search_terms** | Keywords for SEO rank tracking, separated by pipes `\|`. The first term is the canonical (primary) search term. Example: "plumber portland oregon\|best plumber portland" |
| **ai_questions** | Questions for AI visibility monitoring, separated by pipes `\|`. These are questions people might ask AI chatbots. Example: "What does a plumber do?\|Who is the best plumber in Portland?" |
| **funnel_stages** | Marketing funnel stage for each AI question, separated by pipes `\|`. Values: top, middle, or bottom. Should match the number of ai_questions. Example: "top\|bottom" |
| **rank_tracking_group** | Name of an existing rank tracking group to add this concept to. The group must already exist. Example: "Main Keywords" |

## Column aliases

The import system accepts various column name formats. All of these will work:

| Standard name | Also accepts |
|---------------|--------------|
| concept_name | phrase, keyword, keywordphrase |
| concept_group | keyword_group, group |
| review_phrase | customer_phrase |
| search_terms | search_terms (pipe-separated) |
| search_query | searchphrase |
| aliases | alias, alternative_terms |
| location_scope | scope |
| ai_questions | related_questions, questions |
| funnel_stages | stages |
| rank_tracking_group | rank_group |

## Location scope values

If using the location_scope column, valid values are:
- **local** - Neighborhood or city level
- **regional** - State or multi-city area
- **national** - Country-wide
- **global** - International

## Example CSV content

```csv
concept_name,concept_group,review_phrase,aliases,search_terms,ai_questions,funnel_stages,rank_tracking_group
portland plumber,Services,plumbing services,plumber|plumbing,plumber portland oregon|best plumber portland,What does a plumber do?|Who is the best plumber in Portland?,top|bottom,Main Keywords
emergency plumbing,Services,emergency plumbing help,24 hour plumber|urgent plumbing,emergency plumber near me|24/7 plumber,How do I handle a plumbing emergency?,middle,
drain cleaning,,professional drain cleaning,clogged drain|drain unclogging,drain cleaning service portland,,,
```

## Importing your file

1. Click **Choose file** and select your CSV
2. Review the preview showing your data mapped to columns
3. Click **Import keywords** to start the import
4. Review the results showing:
   - How many concepts were created
   - Any duplicates that were skipped
   - Any errors that occurred

## Handling duplicates

The system automatically detects duplicate keywords based on the normalized phrase (lowercased, trimmed). Duplicates are:
- Skipped during import
- Listed in the results so you know which ones weren''t added
- Not counted as errors

## Troubleshooting

### "Phrase is required" error
Every row must have a value in the concept_name (or phrase) column. Check for empty rows in your spreadsheet.

### "Invalid location_scope" error
The location_scope value must be exactly one of: local, regional, national, or global.

### "Rank tracking group not found" error
The rank_tracking_group must match an existing group name exactly. Create the rank tracking group first, or leave this column empty.

### Excel CSV encoding issues
If you see strange characters, ensure your CSV is saved with UTF-8 encoding:
1. In Excel: Save As → CSV UTF-8 (Comma delimited)
2. In Google Sheets: File → Download → Comma-separated values

## Tips for success

1. **Start with the template** - It includes proper formatting and example data
2. **Use pipe separators** - For multi-value fields like search_terms and aliases, use `|` between values
3. **Match funnel stages to questions** - The number of funnel_stages should match the number of ai_questions
4. **Create groups first** - While groups are auto-created, creating them beforehand lets you set custom display orders
5. **Test with a small batch** - Import 5-10 keywords first to verify your format is correct
6. **Keep concepts focused** - Each row should represent one distinct concept, not a list of keywords',
  'published',
  '{
    "category": "keywords",
    "category_label": "Keywords",
    "category_icon": "Tag",
    "category_color": "blue",
    "description": "Learn how to bulk import keyword concepts using a CSV file with all available columns and formatting options.",
    "keywords": ["import", "csv", "keywords", "concepts", "bulk", "upload", "spreadsheet"],
    "tags": ["import", "csv", "bulk-upload", "keywords"],
    "available_plans": ["grower", "builder", "maven", "enterprise"],
    "seo_title": "How to Import Keyword Concepts - Prompt Reviews Help",
    "seo_description": "Complete guide to importing keyword concepts via CSV. Learn about required columns, optional fields, and troubleshooting tips."
  }'::jsonb,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Add to navigation under Keywords category
DO $$
DECLARE
  parent_uuid uuid;
BEGIN
  -- Find or create the Keywords parent navigation item
  SELECT id INTO parent_uuid
  FROM navigation
  WHERE title = 'Keywords' OR href = '/keywords'
  LIMIT 1;

  -- If no Keywords parent exists, create one
  IF parent_uuid IS NULL THEN
    INSERT INTO navigation (title, href, icon_name, order_index, visibility, is_active)
    VALUES (
      'Keywords',
      '/keywords',
      'Tag',
      50,
      ARRAY['docs', 'help'],
      true
    )
    RETURNING id INTO parent_uuid;
  END IF;

  -- Insert the import article navigation entry
  INSERT INTO navigation (parent_id, title, href, icon_name, order_index, visibility, is_active)
  VALUES (
    parent_uuid,
    'How to import concepts',
    '/keywords/import-concepts',
    'Upload',
    10,
    ARRAY['docs', 'help'],
    true
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Add article context for the keywords page so it shows up as contextual help
INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT
  a.id,
  '/dashboard/keywords',
  ARRAY['keywords', 'concepts', 'import', 'csv', 'upload', 'bulk'],
  80
FROM articles a
WHERE a.slug = 'keywords/import-concepts'
ON CONFLICT DO NOTHING;
