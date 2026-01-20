-- Merge duplicate "create service pages" tasks in the work manager library
-- Keep "Create dedicated pages for each major service" with combined best content
-- Delete "Create dedicated landing pages for key services"

-- Update the surviving task with merged content from both
UPDATE wm_library_tasks
SET
  description = 'Build individual pages for each service instead of listing everything on one page.',
  instructions = '1. Create one page per major service offering
2. Write at least 500 words of unique content per page
3. Include the service keyword in URL, title, and H1 heading
4. Add specific details: process, pricing factors, timeline
5. Include all information a customer needs to make a decision
6. Focus on a single, clear call-to-action per page
7. Consider adding urgency or incentive when appropriate',
  education = 'Google prefers topically-focused pages over jack-of-all-trades pages. A dedicated "Kitchen Remodeling" page will outrank a generic "Our Services" page for kitchen remodeling searches. Focused pages also convert better because they match visitor intent precisely - someone searching "emergency plumber" should land on a page focused entirely on emergency plumbing, not your homepage. The leaked Google documents reveal that page quality is assessed at the individual page level, so give each service the focused attention it deserves.'
WHERE title = 'Create dedicated pages for each major service';

-- Delete the duplicate task
DELETE FROM wm_library_tasks
WHERE title = 'Create dedicated landing pages for key services';
