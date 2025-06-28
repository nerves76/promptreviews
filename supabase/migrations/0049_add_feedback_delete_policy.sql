-- Add delete policy for feedback table
-- Admins can delete feedback submissions

CREATE POLICY "Admins can delete feedback" ON feedback
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admins WHERE account_id = auth.uid()
    )
  ); 