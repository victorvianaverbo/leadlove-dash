-- Add slug column for friendly URLs
ALTER TABLE projects ADD COLUMN slug text UNIQUE;

-- Create index for fast slug lookup
CREATE INDEX idx_projects_slug ON projects(slug);

-- Update RLS policy to allow public access by slug
CREATE POLICY "Public can view shared projects by slug"
ON projects FOR SELECT
USING (is_public = true AND slug IS NOT NULL);