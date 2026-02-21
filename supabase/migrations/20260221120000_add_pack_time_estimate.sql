-- Add time_estimate column to wm_library_packs
-- Provides a human-readable estimate of how long a pack takes to complete
-- (scoped to a business with 50-200 pages)

ALTER TABLE wm_library_packs ADD COLUMN time_estimate TEXT;

-- Populate existing packs
UPDATE wm_library_packs SET time_estimate = '1-2 weeks'
  WHERE name = 'SEO Starter Pack';

UPDATE wm_library_packs SET time_estimate = '2-4 weeks'
  WHERE name = 'Service Page Growth Pack';

UPDATE wm_library_packs SET time_estimate = '1-3 months'
  WHERE name = 'Content Growth Pack';

UPDATE wm_library_packs SET time_estimate = '1 week'
  WHERE name = 'CTR Boost Pack';

UPDATE wm_library_packs SET time_estimate = '2-4 weeks'
  WHERE name = 'Technical Cleanup Pack';

UPDATE wm_library_packs SET time_estimate = '1-2 weeks'
  WHERE name = 'Local Visibility Pack';

UPDATE wm_library_packs SET time_estimate = '1-3 months'
  WHERE name = 'AI Visibility Starter Pack';

UPDATE wm_library_packs SET time_estimate = 'Ongoing (monthly)'
  WHERE name = 'Online Visibility Maintenance Pack';
