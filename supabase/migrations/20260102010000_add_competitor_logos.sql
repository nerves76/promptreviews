/**
 * Add Logo URLs to Competitors
 * 
 * Populates the logo_url field for all existing competitors.
 * Logo files already exist in /public/images/pr-competitors/
 * 
 * Migration Date: 2026-01-02
 */

-- Update competitor logos with correct URLs
UPDATE competitors SET logo_url = '/images/pr-competitors/birdeye-icon.png' WHERE slug = 'birdeye';
UPDATE competitors SET logo_url = '/images/pr-competitors/podium-icon.png' WHERE slug = 'podium';
UPDATE competitors SET logo_url = '/images/pr-competitors/nicejob-icon.png' WHERE slug = 'nicejob';
UPDATE competitors SET logo_url = '/images/pr-competitors/gatherup-icon.png' WHERE slug = 'gatherup';
UPDATE competitors SET logo_url = '/images/pr-competitors/gradeus-icon.png' WHERE slug = 'grade-us';
UPDATE competitors SET logo_url = '/images/pr-competitors/brightlocal-icon.png' WHERE slug = 'brightlocal';
UPDATE competitors SET logo_url = '/images/pr-competitors/reputation-icon.png' WHERE slug = 'reputation-com';
UPDATE competitors SET logo_url = '/images/pr-competitors/whitespark-icon.png' WHERE slug = 'whitespark';
