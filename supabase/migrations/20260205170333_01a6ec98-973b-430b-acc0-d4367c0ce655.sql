-- Corrigir view para usar security_invoker (resolve warning de security definer)
DROP VIEW IF EXISTS sales_public;
CREATE VIEW sales_public WITH (security_invoker = true) AS
SELECT 
  id,
  project_id,
  amount,
  gross_amount,
  sale_date,
  created_at,
  external_sale_id,
  product_id,
  product_name,
  status,
  payment_method,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term
FROM sales s
WHERE EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.id = s.project_id 
  AND p.is_public = true 
  AND (p.share_token IS NOT NULL OR p.slug IS NOT NULL)
);