-- Drop and recreate sales_public view without PII columns
DROP VIEW IF EXISTS public.sales_public;

CREATE VIEW public.sales_public
WITH (security_invoker = true) AS
SELECT 
  created_at,
  id,
  project_id,
  amount,
  gross_amount,
  sale_date,
  product_name,
  status,
  payment_method,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term,
  external_sale_id,
  product_id
FROM public.sales;