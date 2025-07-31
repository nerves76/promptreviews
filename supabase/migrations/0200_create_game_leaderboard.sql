-- Create game leaderboard table
CREATE TABLE IF NOT EXISTS game_leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    level INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient leaderboard queries
CREATE INDEX IF NOT EXISTS idx_game_leaderboard_score ON game_leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_leaderboard_created_at ON game_leaderboard(created_at DESC);

-- Add RLS policies
ALTER TABLE game_leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read leaderboard (public)
CREATE POLICY "Allow public read access to leaderboard" ON game_leaderboard
    FOR SELECT USING (true);

-- Allow anyone to insert new scores (public)
CREATE POLICY "Allow public insert to leaderboard" ON game_leaderboard
    FOR INSERT WITH CHECK (true); 