-- Fix "Respond to all Google reviews" to link to Google Business (where GBP reviews are managed)
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Google Business", "route": "/dashboard/google-business"}, {"name": "Reviews", "route": "/dashboard/reviews"}]'
WHERE title = 'Respond to all Google reviews';
