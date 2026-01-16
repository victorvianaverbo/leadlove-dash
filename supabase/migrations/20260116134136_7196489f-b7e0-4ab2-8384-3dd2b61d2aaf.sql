-- Add columns for public sharing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS share_token uuid DEFAULT gen_random_uuid();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON projects(share_token);

-- Add RLS policy for public access via share token
CREATE POLICY "Public can view shared projects"
ON projects FOR SELECT
USING (is_public = true AND share_token IS NOT NULL);

-- Add RLS policy for public access to sales data of shared projects
CREATE POLICY "Public can view sales of shared projects"
ON sales FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = sales.project_id 
    AND projects.is_public = true 
    AND projects.share_token IS NOT NULL
  )
);

-- Add RLS policy for public access to ad_spend data of shared projects
CREATE POLICY "Public can view ad_spend of shared projects"
ON ad_spend FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = ad_spend.project_id 
    AND projects.is_public = true 
    AND projects.share_token IS NOT NULL
  )
);