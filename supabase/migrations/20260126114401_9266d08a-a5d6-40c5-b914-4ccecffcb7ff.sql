-- Drop and recreate the view to include kiwify_ticket_price
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
    class_date,
    use_gross_for_roas,
    kiwify_ticket_price
  FROM public.projects
  WHERE is_public = true AND (share_token IS NOT NULL OR slug IS NOT NULL);