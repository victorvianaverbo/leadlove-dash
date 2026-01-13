-- Add daily_budget column to ad_spend table
ALTER TABLE public.ad_spend ADD COLUMN IF NOT EXISTS daily_budget numeric DEFAULT 0;