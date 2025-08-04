-- Create game_scores table for Prompty Power Game leaderboard
CREATE TABLE IF NOT EXISTS game_scores (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    player_handle TEXT NOT NULL CHECK (length(player_handle) >= 2 AND length(player_handle) <= 20),
    email TEXT,
    score INTEGER NOT NULL CHECK (score >= 0),
    level_reached INTEGER NOT NULL DEFAULT 1 CHECK (level_reached >= 1),
    play_time_seconds INTEGER DEFAULT 0 CHECK (play_time_seconds >= 0),
    game_data JSONB DEFAULT '{}', -- Store additional game stats
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for leaderboard queries (top scores)
CREATE INDEX IF NOT EXISTS idx_game_scores_leaderboard ON game_scores (score DESC, created_at ASC);

-- Create index for email lookups (for user's best scores)
CREATE INDEX IF NOT EXISTS idx_game_scores_email ON game_scores (email) WHERE email IS NOT NULL;

-- Create index for handle lookups (prevent duplicate handles)
CREATE INDEX IF NOT EXISTS idx_game_scores_handle ON game_scores (lower(player_handle));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_game_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_game_scores_updated_at
    BEFORE UPDATE ON game_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_game_scores_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Allow public read access for leaderboard (no sensitive data exposed)
CREATE POLICY "Allow public read access to game scores" ON game_scores
    FOR SELECT USING (true);

-- Allow public insert for score submission (rate limited via API)
CREATE POLICY "Allow public insert of game scores" ON game_scores
    FOR INSERT WITH CHECK (true);

-- Prevent updates and deletes from public (only via admin)
CREATE POLICY "Prevent public updates" ON game_scores
    FOR UPDATE USING (false);

CREATE POLICY "Prevent public deletes" ON game_scores
    FOR DELETE USING (false);

-- Create a view for public leaderboard (only safe fields)
CREATE OR REPLACE VIEW public_leaderboard AS
SELECT 
    player_handle,
    score,
    level_reached,
    created_at,
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

-- Grant permissions
GRANT SELECT ON public_leaderboard TO anon, authenticated;
GRANT SELECT, INSERT ON game_scores TO anon, authenticated;
GRANT USAGE ON SEQUENCE game_scores_id_seq TO anon, authenticated;

-- Add helpful comments
COMMENT ON TABLE game_scores IS 'Stores high scores for Prompty Power Game with leaderboard and email capture';
COMMENT ON COLUMN game_scores.player_handle IS 'Player chosen display name (2-20 characters)';
COMMENT ON COLUMN game_scores.email IS 'Optional email for marketing leads and score tracking';
COMMENT ON COLUMN game_scores.score IS 'Final game score (authority points)';
COMMENT ON COLUMN game_scores.level_reached IS 'Highest level completed';
COMMENT ON COLUMN game_scores.game_data IS 'Additional game statistics (customers converted, bosses defeated, etc.)';
COMMENT ON VIEW public_leaderboard IS 'Public-safe view of game scores for leaderboard display';