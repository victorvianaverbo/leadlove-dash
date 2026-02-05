-- Renomear constraint única para refletir novo nome da coluna
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_kiwify_sale_id_key;
ALTER TABLE public.sales ADD CONSTRAINT sales_external_sale_id_key UNIQUE (external_sale_id);