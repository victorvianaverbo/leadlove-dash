
-- Fix 1: Remove anon policy that exposes PII (customer_email, customer_name) on sales table
-- Public dashboards use sales_public view which already excludes PII
DROP POLICY IF EXISTS "Anon can view sales of shared projects" ON public.sales;

-- Fix 3: Recreate sales_public view WITHOUT security_invoker
-- This way the view runs as definer (bypassing RLS on sales table)
-- and only exposes non-PII columns for public projects
DROP VIEW IF EXISTS public.sales_public;

CREATE VIEW public.sales_public AS
SELECT
  s.id,
  s.project_id,
  s.amount,
  s.gross_amount,
  s.sale_date,
  s.created_at,
  s.product_id,
  s.product_name,
  s.status,
  s.payment_method,
  s.utm_source,
  s.utm_medium,
  s.utm_campaign,
  s.utm_content,
  s.utm_term,
  s.external_sale_id
FROM public.sales s
WHERE EXISTS (
  SELECT 1 FROM public.projects p
  WHERE p.id = s.project_id
  AND p.is_public = true
  AND (p.share_token IS NOT NULL OR p.slug IS NOT NULL)
);

-- Revoke write access on the view to prevent abuse
REVOKE INSERT, UPDATE, DELETE ON public.sales_public FROM anon, authenticated;
