-- Migration: Update kickstarter questions to replace em dashes with commas
-- Date: 2025-01-27

-- Update kickstarter questions to replace em dashes with commas
UPDATE kickstarters SET 
    question = 'What was your first impression, and what confirmed [Business Name] was the right choice?' 
WHERE question = 'What was your first impression—and what confirmed [Business Name] was the right choice?' 
    AND is_default = true;

UPDATE kickstarters SET 
    question = 'What surprised you, in a good way, during your time with [Business Name]?' 
WHERE question = 'What surprised you—in a good way—during your time with [Business Name]?' 
    AND is_default = true;

UPDATE kickstarters SET 
    question = 'What''s one word you''d use to describe [Business Name], and why?' 
WHERE question = 'What''s one word you''d use to describe [Business Name]—and why?' 
    AND is_default = true;

UPDATE kickstarters SET 
    question = 'How did [Business Name] meet, or exceed, your expectations?' 
WHERE question = 'How did [Business Name] meet—or exceed—your expectations?' 
    AND is_default = true; 