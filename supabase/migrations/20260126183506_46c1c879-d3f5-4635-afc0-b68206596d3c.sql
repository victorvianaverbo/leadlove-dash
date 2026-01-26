-- Drop the old constraint and create a new one with all integration types
ALTER TABLE public.integrations DROP CONSTRAINT integrations_type_check;

ALTER TABLE public.integrations ADD CONSTRAINT integrations_type_check 
CHECK (type = ANY (ARRAY['kiwify'::text, 'hotmart'::text, 'guru'::text, 'eduzz'::text, 'meta_ads'::text]));