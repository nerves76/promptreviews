-- Fix feedback RLS policies to allow anonymous submissions
-- This resolves the issue where users think they submitted feedback but it gets silently blocked

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;

-- Create new INSERT policy that allows both authenticated and anonymous feedback
CREATE POLICY "Allow feedback submissions" ON feedback
  FOR INSERT WITH CHECK (
    -- Allow if user is authenticated and owns the feedback
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR 
    -- Allow anonymous feedback when user_id is null
    (auth.uid() IS NULL AND user_id IS NULL)
    OR
    -- Allow authenticated users to submit anonymous feedback (fallback case)
    (auth.uid() IS NOT NULL AND user_id IS NULL)
  );

-- Add comment explaining the policy
COMMENT ON TABLE feedback IS 'User feedback and bug reports. Supports both authenticated and anonymous submissions to ensure no feedback is lost due to auth issues.'; 