-- Add owner_id column to businesses table
ALTER TABLE public.businesses 
ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- Update existing rows to set owner_id = id
UPDATE public.businesses 
SET owner_id = id 
WHERE owner_id IS NULL;

-- Make owner_id NOT NULL after setting values
ALTER TABLE public.businesses 
ALTER COLUMN owner_id SET NOT NULL;

-- Update RLS policies to use owner_id
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
CREATE POLICY "Users can view their own business profile"
  ON public.businesses FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
CREATE POLICY "Users can update their own business profile"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;
CREATE POLICY "Users can create their own business profile"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = owner_id); 