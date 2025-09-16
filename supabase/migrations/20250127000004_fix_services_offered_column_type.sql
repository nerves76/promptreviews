-- Fix services_offered column type to match application usage
-- The application saves services as JSON arrays, but the column was created as text

-- First check if the column is already jsonb
DO $$
BEGIN
  -- Only proceed if the column is not already jsonb
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'businesses' 
    AND column_name = 'services_offered'
    AND data_type != 'jsonb'
  ) THEN
    -- First, clean up the data to ensure it's valid JSON
    UPDATE businesses 
    SET services_offered = CASE 
      WHEN services_offered IS NULL THEN NULL
      WHEN services_offered = '' THEN '[]'
      WHEN services_offered LIKE '[%' AND services_offered LIKE '%]' THEN 
        -- It looks like JSON array, try to validate it
        CASE 
          WHEN services_offered::jsonb IS NOT NULL THEN services_offered
          ELSE '[]'
        END
      ELSE 
        -- Convert single value or newline-separated values to JSON array
        '["' || REPLACE(REPLACE(services_offered, E'\n', '","'), '"', '\"') || '"]'
    END
    WHERE services_offered IS NOT NULL;

    -- Change the column type from text to jsonb
    ALTER TABLE businesses 
    ALTER COLUMN services_offered TYPE jsonb USING 
      CASE 
        WHEN services_offered IS NULL THEN NULL
        WHEN services_offered = '' THEN '[]'::jsonb
        ELSE services_offered::jsonb
      END;
  END IF;
END $$;

-- Add comment to clarify the column purpose
COMMENT ON COLUMN businesses.services_offered IS 'JSON array of services offered by the business'; 