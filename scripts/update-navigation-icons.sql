-- Update navigation icons to use appropriate Lucide React icons
-- Run this on production to fix the icon issue where all sections use the same icon

-- Getting Started section
UPDATE navigation
SET icon_name = 'Rocket'
WHERE title ILIKE '%getting%start%' OR title = 'Getting Started';

-- Prompt Pages section - using Square badge style for [P]
UPDATE navigation
SET icon_name = 'SquareP'
WHERE title ILIKE '%prompt%page%' OR title = 'Prompt Pages';

-- Widgets section
UPDATE navigation
SET icon_name = 'Code'
WHERE title ILIKE '%widget%' OR title = 'Widgets';

-- Reviews section
UPDATE navigation
SET icon_name = 'Star'
WHERE title ILIKE '%review%' AND NOT title ILIKE '%ai%' OR title = 'Reviews';

-- Business Profile section
UPDATE navigation
SET icon_name = 'Building'
WHERE title ILIKE '%business%profile%' OR title = 'Business Profile' OR title = 'Your Business';

-- Google Business section
UPDATE navigation
SET icon_name = 'Building2'
WHERE title ILIKE '%google%business%' OR title ILIKE '%google%biz%' OR title = 'Google Business';

-- Contacts section
UPDATE navigation
SET icon_name = 'Users'
WHERE title ILIKE '%contact%' OR title = 'Contacts';

-- Analytics section
UPDATE navigation
SET icon_name = 'BarChart'
WHERE title ILIKE '%analytic%' OR title = 'Analytics';

-- Settings section
UPDATE navigation
SET icon_name = 'Settings'
WHERE title ILIKE '%setting%' OR title = 'Settings';

-- Team section
UPDATE navigation
SET icon_name = 'Users'
WHERE title ILIKE '%team%' OR title = 'Team';

-- Billing section
UPDATE navigation
SET icon_name = 'CreditCard'
WHERE title ILIKE '%billing%' OR title ILIKE '%payment%' OR title = 'Billing';

-- API section
UPDATE navigation
SET icon_name = 'Code2'
WHERE title ILIKE '%api%' OR title = 'API';

-- Help/FAQ section
UPDATE navigation
SET icon_name = 'HelpCircle'
WHERE title ILIKE '%help%' OR title ILIKE '%faq%' OR title = 'Help' OR title = 'FAQ';

-- Strategies section
UPDATE navigation
SET icon_name = 'Lightbulb'
WHERE title ILIKE '%strateg%' OR title = 'Strategies';

-- Integrations section
UPDATE navigation
SET icon_name = 'Plug'
WHERE title ILIKE '%integrat%' OR title = 'Integrations';

-- Troubleshooting section
UPDATE navigation
SET icon_name = 'AlertCircle'
WHERE title ILIKE '%troubleshoot%' OR title = 'Troubleshooting';

-- AI Reviews section
UPDATE navigation
SET icon_name = 'Sparkles'
WHERE title ILIKE '%ai%review%' OR title = 'AI Reviews' OR title ILIKE '%ai-assist%';

-- Features section (generic)
UPDATE navigation
SET icon_name = 'Zap'
WHERE title ILIKE '%feature%' AND icon_name IS NULL OR title = 'Features';

-- Advanced section
UPDATE navigation
SET icon_name = 'Cog'
WHERE title ILIKE '%advanced%' OR title = 'Advanced';

-- Style/Customization sections
UPDATE navigation
SET icon_name = 'Palette'
WHERE title ILIKE '%style%' OR title ILIKE '%customiz%' OR title ILIKE '%theme%';

-- Types/Categories subsections (for prompt page types, etc)
UPDATE navigation
SET icon_name = 'List'
WHERE title ILIKE '%type%' AND parent_id IS NOT NULL;

-- Universal/General items
UPDATE navigation
SET icon_name = 'Globe'
WHERE title ILIKE '%universal%';

-- Service-specific items
UPDATE navigation
SET icon_name = 'Briefcase'
WHERE title ILIKE '%service%';

-- Photo/Image related
UPDATE navigation
SET icon_name = 'Image'
WHERE title ILIKE '%photo%' OR title ILIKE '%image%';

-- Video related
UPDATE navigation
SET icon_name = 'Video'
WHERE title ILIKE '%video%';

-- Product related
UPDATE navigation
SET icon_name = 'Package'
WHERE title ILIKE '%product%';

-- Employee related
UPDATE navigation
SET icon_name = 'UserCircle'
WHERE title ILIKE '%employee%';

-- Event related
UPDATE navigation
SET icon_name = 'Calendar'
WHERE title ILIKE '%event%';

-- Mobile related
UPDATE navigation
SET icon_name = 'Smartphone'
WHERE title ILIKE '%mobile%';

-- QR Code related
UPDATE navigation
SET icon_name = 'QrCode'
WHERE title ILIKE '%qr%';

-- Security related
UPDATE navigation
SET icon_name = 'Shield'
WHERE title ILIKE '%security%' OR title ILIKE '%privacy%';

-- Default icon for any remaining null icons
UPDATE navigation
SET icon_name = 'BookOpen'
WHERE icon_name IS NULL AND is_active = true;

-- Update timestamp
UPDATE navigation
SET updated_at = NOW()
WHERE is_active = true;

-- Show summary of changes
SELECT
  icon_name,
  COUNT(*) as count,
  STRING_AGG(title, ', ' ORDER BY title) as titles
FROM navigation
WHERE is_active = true
GROUP BY icon_name
ORDER BY count DESC, icon_name;
