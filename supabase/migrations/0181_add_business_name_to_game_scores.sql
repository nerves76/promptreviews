-- Add business_name column to game_scores table
ALTER TABLE game_scores ADD COLUMN business_name TEXT;

-- Add index for business_name
CREATE INDEX IF NOT EXISTS idx_game_scores_business_name ON game_scores (business_name) WHERE business_name IS NOT NULL;

-- Update the public_leaderboard view to include business_name
DROP VIEW IF EXISTS public_leaderboard;
CREATE VIEW public_leaderboard AS
SELECT 
    player_handle,
    business_name,
    score,
    level_reached,
    created_at,
    website,
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
LIMIT 100;