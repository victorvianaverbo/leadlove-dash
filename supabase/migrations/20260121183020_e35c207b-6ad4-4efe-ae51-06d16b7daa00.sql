-- Add unique constraint on kiwify_sale_id for upsert to work
ALTER TABLE public.sales ADD CONSTRAINT sales_kiwify_sale_id_key UNIQUE (kiwify_sale_id);