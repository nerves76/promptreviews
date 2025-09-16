-- Fix feedback RLS policies to use account_id instead of user_id
-- The admins table uses account_id, but the feedback RLS policies were checking user_id

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;

-- Recreate admin policies with correct account_id reference
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE account_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update feedback" ON feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins WHERE account_id = auth.uid()
    )
  ); 