-- Add 'individual' type to prompt_page_type enum
DO $$ BEGIN
    -- Add 'individual' if it doesn't exist
    BEGIN
        ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'individual';
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;
END $$;

-- Update existing non-universal, non-location prompt pages to have type 'service'
UPDATE prompt_pages
SET type = 'service'
WHERE is_universal = false
AND business_location_id IS NULL
AND (type IS NULL OR type NOT IN ('product', 'service', 'photo', 'universal')); 