-- Add new funnel metrics columns to ad_spend table
ALTER TABLE ad_spend
ADD COLUMN IF NOT EXISTS reach integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS frequency numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpc numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpm numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS landing_page_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS link_clicks integer DEFAULT 0;