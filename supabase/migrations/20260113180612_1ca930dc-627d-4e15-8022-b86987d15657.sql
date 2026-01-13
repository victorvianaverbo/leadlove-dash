-- Add columns for checkout, thruplay and video metrics
ALTER TABLE public.ad_spend 
ADD COLUMN checkouts_initiated integer DEFAULT 0,
ADD COLUMN thruplays integer DEFAULT 0,
ADD COLUMN video_3s_views integer DEFAULT 0;