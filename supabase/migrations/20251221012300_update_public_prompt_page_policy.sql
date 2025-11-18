-- Allow public access to universal prompt pages regardless of status
-- This re-applies the fix from 20251002001006 which was accidentally reverted
ALTER POLICY "Public can view universal prompt pages" ON public.prompt_pages
USING (visibility = 'public' OR is_universal = true);
