-- Add gross_amount column to sales table for storing total charged amount
ALTER TABLE sales ADD COLUMN gross_amount numeric;

-- Add use_gross_for_roas column to projects table for per-project ROAS configuration
ALTER TABLE projects ADD COLUMN use_gross_for_roas boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN sales.gross_amount IS 'Total charged amount (before co-production split). Used when project has use_gross_for_roas=true';
COMMENT ON COLUMN projects.use_gross_for_roas IS 'When true, use gross_amount instead of amount for ROAS calculations (for co-productions)';