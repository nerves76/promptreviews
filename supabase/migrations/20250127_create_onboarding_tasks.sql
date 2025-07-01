-- Create onboarding_tasks table to track user onboarding progress
CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per account per task
  UNIQUE(account_id, task_id)
);

-- Add RLS policies
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own onboarding tasks
DROP POLICY IF EXISTS "Users can view their own onboarding tasks" ON onboarding_tasks;
CREATE POLICY "Users can view their own onboarding tasks" ON onboarding_tasks
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own onboarding tasks
DROP POLICY IF EXISTS "Users can insert their own onboarding tasks" ON onboarding_tasks;
CREATE POLICY "Users can insert their own onboarding tasks" ON onboarding_tasks
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own onboarding tasks
DROP POLICY IF EXISTS "Users can update their own onboarding tasks" ON onboarding_tasks;
CREATE POLICY "Users can update their own onboarding tasks" ON onboarding_tasks
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own onboarding tasks
DROP POLICY IF EXISTS "Users can delete their own onboarding tasks" ON onboarding_tasks;
CREATE POLICY "Users can delete their own onboarding tasks" ON onboarding_tasks
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_account_id ON onboarding_tasks(account_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_task_id ON onboarding_tasks(task_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists before creating it
DROP TRIGGER IF EXISTS trigger_update_onboarding_tasks_updated_at ON onboarding_tasks;
CREATE TRIGGER trigger_update_onboarding_tasks_updated_at
  BEFORE UPDATE ON onboarding_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_tasks_updated_at(); 