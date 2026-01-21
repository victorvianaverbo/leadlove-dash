-- Add unique constraint for ad_spend upsert including ad_id
ALTER TABLE public.ad_spend 
ADD CONSTRAINT ad_spend_campaign_date_project_ad_key 
UNIQUE (campaign_id, date, project_id, ad_id);