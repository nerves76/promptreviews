ALTER POLICY "Public can view universal prompt pages" ON public.prompt_pages USING (visibility = 'public' OR (is_universal = true AND status = 'in_queue'));
