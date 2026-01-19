-- Add benchmark columns to projects table for funnel metrics
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS benchmark_engagement numeric DEFAULT 2.0,
ADD COLUMN IF NOT EXISTS benchmark_ctr numeric DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS benchmark_lp_rate numeric DEFAULT 70.0,
ADD COLUMN IF NOT EXISTS benchmark_checkout_rate numeric DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS benchmark_sale_rate numeric DEFAULT 2.0;

-- Add comments for documentation
COMMENT ON COLUMN public.projects.benchmark_engagement IS 'Taxa de Engajamento Criativo mínima esperada (%)';
COMMENT ON COLUMN public.projects.benchmark_ctr IS 'CTR (Link Clicks) mínimo esperado (%)';
COMMENT ON COLUMN public.projects.benchmark_lp_rate IS 'Taxa LP/Clique mínima esperada (%)';
COMMENT ON COLUMN public.projects.benchmark_checkout_rate IS 'Taxa de Conversão Checkout mínima esperada (%)';
COMMENT ON COLUMN public.projects.benchmark_sale_rate IS 'Taxa Venda/LP mínima esperada (%)';