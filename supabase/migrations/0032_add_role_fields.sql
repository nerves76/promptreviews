-- Add role field to contacts table
ALTER TABLE public.contacts
ADD COLUMN role TEXT;

-- Add role field to prompt_pages table
ALTER TABLE public.prompt_pages
ADD COLUMN role TEXT;

-- Add comments
COMMENT ON COLUMN public.contacts.role IS 'Role/Position/Occupation of the contact';
 