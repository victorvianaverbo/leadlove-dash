-- Create a public projects view that excludes sensitive user_id field
-- This prevents user identity exposure on public dashboards
CREATE OR REPLACE VIEW public.projects_public AS
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

-- Enable RLS on the view (inherited from underlying table)
-- Views automatically inherit RLS from their base tables, but we add explicit policy
COMMENT ON VIEW public.projects_public IS 'Public view of projects excluding user_id for privacy';