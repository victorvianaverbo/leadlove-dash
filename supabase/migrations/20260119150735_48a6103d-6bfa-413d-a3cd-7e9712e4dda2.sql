-- Drop and recreate view with security_invoker=on to fix the security definer warning
DROP VIEW IF EXISTS public.projects_public;

CREATE VIEW public.projects_public
WITH (security_invoker=on) AS
SELECT 
  id, 
  name, 
  description, 
  slug, 
  is_public, 
  share_token,
  created_at, 
  updated_at, 
  last_sync_at, 
  kiwify_product_ids, 
  meta_campaign_ids,
  benchmark_engagement,
  benchmark_ctr,
  benchmark_lp_rate,
  benchmark_checkout_rate,
  benchmark_sale_rate,
  campaign_objective,
  ad_type,
  account_status,
  investment_value,
  class_date
FROM public.projects
WHERE is_public = true AND slug IS NOT NULL;

COMMENT ON VIEW public.projects_public IS 'Public view of projects excluding user_id for privacy - uses security_invoker for proper RLS';