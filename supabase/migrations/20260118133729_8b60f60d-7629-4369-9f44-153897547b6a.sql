-- Create a public view for sales WITHOUT PII fields (customer_email, customer_name)
CREATE VIEW public.sales_public
WITH (security_invoker = on) AS
SELECT 
  id,
  project_id,
  user_id,
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

-- Drop the existing public policy that exposes PII
DROP POLICY IF EXISTS "Public can view sales of shared projects" ON public.sales;