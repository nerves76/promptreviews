-- Fix missing pack icons
-- FaMousePointer doesn't exist, FaRobot may not be in sprite sheet

UPDATE wm_library_packs
SET icon = 'FaChartLine'
WHERE name = 'CTR Boost Pack';

UPDATE wm_library_packs
SET icon = 'FaLightbulb'
WHERE name = 'AI Visibility Starter Pack';
