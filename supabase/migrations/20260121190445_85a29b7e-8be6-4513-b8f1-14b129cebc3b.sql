-- Remove the old constraint that doesn't include ad_id
-- This causes conflicts when multiple ads exist for the same campaign/date/project
ALTER TABLE public.ad_spend DROP CONSTRAINT IF EXISTS ad_spend_campaign_id_date_project_id_key;