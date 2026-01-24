-- Recreate sales_public view to include gross_amount
DROP VIEW IF EXISTS public.sales_public;

CREATE VIEW public.sales_public AS
SELECT 
  id,
  project_id,
  kiwify_sale_id,
  product_id,
  product_name,
  amount,
  gross_amount,
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