-- Add RLS policies for admin users to manage announcements
-- Fixes 403 Forbidden errors when admins try to create/update/delete announcements

-- Policy: Allow admin users to insert announcements
CREATE POLICY "admins_can_insert_announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = auth.uid()
    AND accounts.is_admin = true
  )
);

-- Policy: Allow admin users to update announcements
CREATE POLICY "admins_can_update_announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = auth.uid()
    AND accounts.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = auth.uid()
    AND accounts.is_admin = true
  )
);

-- Policy: Allow admin users to delete announcements
CREATE POLICY "admins_can_delete_announcements"
ON public.announcements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = auth.uid()
    AND accounts.is_admin = true
  )
);

-- Policy: Allow admin users to select all announcements (not just active ones)
CREATE POLICY "admins_can_select_all_announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = auth.uid()
    AND accounts.is_admin = true
  )
);
