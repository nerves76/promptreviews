-- Add account_id to posts and comments to track business context
-- This fixes account bleed where users with multiple businesses
-- would show the wrong business name on their posts

-- Add account_id to posts table
ALTER TABLE posts
ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;

-- Add account_id to comments table
ALTER TABLE comments
ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_account_id ON posts(account_id);
CREATE INDEX IF NOT EXISTS idx_comments_account_id ON comments(account_id);

-- Update existing posts to use the first account for each user
-- This is a best-effort migration for existing data
UPDATE posts p
SET account_id = (
  SELECT au.account_id
  FROM account_users au
  WHERE au.user_id = p.author_id
  LIMIT 1
)
WHERE account_id IS NULL;

-- Update existing comments similarly
UPDATE comments c
SET account_id = (
  SELECT au.account_id
  FROM account_users au
  WHERE au.user_id = c.author_id
  LIMIT 1
)
WHERE account_id IS NULL;

-- Make account_id required going forward
ALTER TABLE posts ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE comments ALTER COLUMN account_id SET NOT NULL;
