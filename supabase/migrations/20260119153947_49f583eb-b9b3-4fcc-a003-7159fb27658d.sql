-- Update sales_public view to exclude user_id for privacy
DROP VIEW IF EXISTS public.sales_public;

CREATE VIEW public.sales_public
WITH (security_invoker=on) AS
SELECT 
  id,
  project_id,
  kiwify_sale_id,
  product_id,
  product_name,
  amount,
  status,
  payment_method,
  sale_date,
  created_at,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term
FROM public.sales;

COMMENT ON VIEW public.sales_public IS 'Public view of sales excluding user_id and customer PII for privacy';