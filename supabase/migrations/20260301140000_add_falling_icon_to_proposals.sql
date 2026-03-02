-- Add configurable falling icon animation to proposals/contracts
-- Defaults: 'star' icon in amber/gold color (matches existing StarfallCelebration behavior)
ALTER TABLE proposals ADD COLUMN falling_icon TEXT DEFAULT 'star';
ALTER TABLE proposals ADD COLUMN falling_icon_color TEXT DEFAULT '#fbbf24';
