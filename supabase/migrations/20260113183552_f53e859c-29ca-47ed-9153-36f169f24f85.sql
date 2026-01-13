-- Fix integrations UPDATE policy to include project ownership verification
DROP POLICY IF EXISTS "Users can update own integrations" ON integrations;

CREATE POLICY "Users can update own integrations" 
ON integrations FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);