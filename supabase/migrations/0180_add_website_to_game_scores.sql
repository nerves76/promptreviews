-- Add website column to game_scores table for player website submissions
ALTER TABLE game_scores 
ADD COLUMN website TEXT;

-- Add a check constraint to ensure valid URL format (basic validation)
ALTER TABLE game_scores 
ADD CONSTRAINT check_website_format 
CHECK (website IS NULL OR (
    website ~* '^https?://.+' AND 
    length(website) <= 255
));

-- Create index for website lookups
CREATE INDEX IF NOT EXISTS idx_game_scores_website ON game_scores (website) WHERE website IS NOT NULL;

-- Drop and recreate the public leaderboard view to include website
DROP VIEW IF EXISTS public_leaderboard;
CREATE VIEW public_leaderboard AS
SELECT 
    player_handle,
    score,
    level_reached,
    created_at,
    website,
    -- Mask email for privacy (show only domain if provided)
    CASE 
        WHEN email IS NOT NULL THEN 
            CASE 
                WHEN position('@' in email) > 0 THEN 
                    '***@' || split_part(email, '@', 2)
                ELSE '***'
            END
        ELSE NULL
    END as email_domain
FROM game_scores
ORDER BY score DESC, created_at ASC
LIMIT 100; -- Top 100 for API efficiency

-- Add comment for the new column
COMMENT ON COLUMN game_scores.website IS 'Optional player website URL for business promotion and lead generation';