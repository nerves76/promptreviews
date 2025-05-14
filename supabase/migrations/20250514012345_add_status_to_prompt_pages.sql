-- Create status enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE prompt_page_status AS ENUM ('in_queue', 'on_hold', 'accomplished', 'draft');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Convert existing status column to use the enum type
DO $$ BEGIN
    -- First, create a temporary column with the new type
    ALTER TABLE prompt_pages
    ADD COLUMN status_new prompt_page_status;

    -- Update the new column based on existing values
    UPDATE prompt_pages
    SET status_new = CASE 
        WHEN status = 'draft' THEN 'draft'::prompt_page_status
        ELSE 'in_queue'::prompt_page_status
    END;

    -- Drop the old column
    ALTER TABLE prompt_pages
    DROP COLUMN status;

    -- Rename the new column to status
    ALTER TABLE prompt_pages
    RENAME COLUMN status_new TO status;

    -- Set the default value
    ALTER TABLE prompt_pages
    ALTER COLUMN status SET DEFAULT 'in_queue'::prompt_page_status;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add index for faster status queries if it doesn't exist
DO $$ BEGIN
    CREATE INDEX idx_prompt_pages_status ON prompt_pages(status);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
