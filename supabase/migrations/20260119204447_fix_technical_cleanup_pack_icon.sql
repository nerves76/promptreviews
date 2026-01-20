-- Fix missing icon for Technical Cleanup Pack
UPDATE wm_library_packs
SET icon = 'FaWrench'
WHERE name = 'Technical Cleanup Pack';
