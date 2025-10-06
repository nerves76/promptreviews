-- Fix emoji icons to Lucide icon names for ai-reviews article
-- This replaces emoji characters with proper Lucide React icon component names

UPDATE articles
SET metadata = jsonb_set(
  jsonb_set(
    jsonb_set(
      metadata,
      '{key_features}',
      (
        SELECT jsonb_agg(
          CASE
            WHEN elem->>'icon' = '🧠' THEN jsonb_set(elem, '{icon}', '"Brain"')
            WHEN elem->>'icon' = '🎯' THEN jsonb_set(elem, '{icon}', '"Target"')
            WHEN elem->>'icon' = '🪄' THEN jsonb_set(elem, '{icon}', '"Wand2"')
            WHEN elem->>'icon' = '📈' THEN jsonb_set(elem, '{icon}', '"TrendingUp"')
            WHEN elem->>'icon' = '🛡️' OR elem->>'icon' = '🛡' THEN jsonb_set(elem, '{icon}', '"Shield"')
            WHEN elem->>'icon' = '✏️' OR elem->>'icon' = '✏' THEN jsonb_set(elem, '{icon}', '"Edit3"')
            WHEN elem->>'icon' = '⭐' THEN jsonb_set(elem, '{icon}', '"Star"')
            WHEN elem->>'icon' = '💡' THEN jsonb_set(elem, '{icon}', '"Lightbulb"')
            ELSE elem
          END
        )
        FROM jsonb_array_elements(metadata->'key_features') elem
      )
    ),
    '{how_it_works}',
    (
      SELECT jsonb_agg(
        CASE
          WHEN elem->>'icon' = '👥' THEN jsonb_set(elem, '{icon}', '"Users"')
          WHEN elem->>'icon' = '🎯' THEN jsonb_set(elem, '{icon}', '"Target"')
          WHEN elem->>'icon' = '💬' THEN jsonb_set(elem, '{icon}', '"MessageSquare"')
          WHEN elem->>'icon' = '📈' THEN jsonb_set(elem, '{icon}', '"TrendingUp"')
          WHEN elem->>'icon' = '🧠' THEN jsonb_set(elem, '{icon}', '"Brain"')
          ELSE elem
        END
      )
      FROM jsonb_array_elements(metadata->'how_it_works') elem
    )
  ),
  '{best_practices}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'icon' = '❤️' OR elem->>'icon' = '❤' THEN jsonb_set(elem, '{icon}', '"Heart"')
        WHEN elem->>'icon' = '⏰' THEN jsonb_set(elem, '{icon}', '"Clock"')
        WHEN elem->>'icon' = '⭐' THEN jsonb_set(elem, '{icon}', '"Star"')
        WHEN elem->>'icon' = '⚡' THEN jsonb_set(elem, '{icon}', '"Zap"')
        WHEN elem->>'icon' = '🎯' THEN jsonb_set(elem, '{icon}', '"Target"')
        WHEN elem->>'icon' = '💡' THEN jsonb_set(elem, '{icon}', '"Lightbulb"')
        ELSE elem
      END
    )
    FROM jsonb_array_elements(metadata->'best_practices') elem
  )
)
WHERE slug = 'ai-reviews';

-- Verify the update
SELECT
  slug,
  metadata->'key_features' as key_features,
  metadata->'how_it_works' as how_it_works,
  metadata->'best_practices' as best_practices
FROM articles
WHERE slug = 'ai-reviews';
