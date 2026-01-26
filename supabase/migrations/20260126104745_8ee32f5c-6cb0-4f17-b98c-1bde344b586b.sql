-- Add ticket price column for fixed Kiwify product price
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS kiwify_ticket_price DECIMAL(10,2);

-- Comment for documentation
COMMENT ON COLUMN projects.kiwify_ticket_price IS 
  'Fixed product price for Kiwify. When set, used as gross_amount instead of dynamic calculation.';