-- Add project_id column to integrations table
ALTER TABLE integrations ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- Create unique constraint for project + type combination
ALTER TABLE integrations ADD CONSTRAINT integrations_project_type_unique UNIQUE (project_id, type);

-- Update RLS policies to also check project ownership
DROP POLICY IF EXISTS "Users can view own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can insert own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can update own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can delete own integrations" ON integrations;

CREATE POLICY "Users can view own integrations" 
ON integrations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations" 
ON integrations FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update own integrations" 
ON integrations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations" 
ON integrations FOR DELETE 
USING (auth.uid() = user_id);