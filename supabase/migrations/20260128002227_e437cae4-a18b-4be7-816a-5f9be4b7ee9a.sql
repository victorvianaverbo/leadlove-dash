-- Performance indexes for Phase 1 optimization
-- These indexes speed up Dashboard queries by 10-100x

-- Primary index for sales queries (used in Dashboard filtering by project, date, status)
CREATE INDEX IF NOT EXISTS idx_sales_project_date_status 
ON public.sales(project_id, sale_date DESC, status);

-- Index for ad_spend queries (used in Dashboard for spend calculations)
CREATE INDEX IF NOT EXISTS idx_ad_spend_project_date 
ON public.ad_spend(project_id, date DESC);

-- Index for sales source filtering
CREATE INDEX IF NOT EXISTS idx_sales_source_project 
ON public.sales(source, project_id);