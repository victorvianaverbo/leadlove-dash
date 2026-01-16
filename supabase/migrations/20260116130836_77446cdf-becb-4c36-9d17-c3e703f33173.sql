-- Add editable project settings columns
ALTER TABLE public.projects ADD COLUMN investment_value numeric DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN class_date timestamp with time zone;
ALTER TABLE public.projects ADD COLUMN campaign_objective text DEFAULT 'sales';
ALTER TABLE public.projects ADD COLUMN account_status text DEFAULT 'active';
ALTER TABLE public.projects ADD COLUMN ad_type text DEFAULT 'flex';