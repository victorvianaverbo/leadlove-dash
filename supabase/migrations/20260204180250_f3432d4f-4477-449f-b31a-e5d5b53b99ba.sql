-- Function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_slug_from_name(name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(name, '[áàãâä]', 'a', 'gi'),
          '[éèêë]', 'e', 'gi'
        ),
        '[íìîï]', 'i', 'gi'
      ),
      '[óòõôö]', 'o', 'gi'
    )
  );
$$;

-- Generate slugs for existing projects that don't have one
UPDATE projects
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        -- Remove accents first (simplified approach)
        translate(name, 'áàãâäéèêëíìîïóòõôöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- Handle duplicate slugs by adding suffix for same user
DO $$
DECLARE
  r RECORD;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  -- Find duplicates within same user
  FOR r IN 
    SELECT p1.id, p1.slug, p1.user_id
    FROM projects p1
    WHERE EXISTS (
      SELECT 1 FROM projects p2 
      WHERE p2.user_id = p1.user_id 
      AND p2.slug = p1.slug 
      AND p2.id != p1.id
      AND p2.created_at < p1.created_at
    )
    ORDER BY p1.created_at
  LOOP
    counter := 2;
    new_slug := r.slug || '-' || counter;
    
    WHILE EXISTS (
      SELECT 1 FROM projects 
      WHERE user_id = r.user_id AND slug = new_slug AND id != r.id
    ) LOOP
      counter := counter + 1;
      new_slug := r.slug || '-' || counter;
    END LOOP;
    
    UPDATE projects SET slug = new_slug WHERE id = r.id;
  END LOOP;
END $$;

-- Add unique constraint per user
ALTER TABLE projects 
ADD CONSTRAINT projects_user_slug_unique 
UNIQUE (user_id, slug);