-- Fase 1: Adicionar colunas de video na tabela ad_spend
ALTER TABLE public.ad_spend 
ADD COLUMN IF NOT EXISTS video_p25_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_p50_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_p75_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_p100_views integer DEFAULT 0;

-- Fase 1.2: Adicionar campo de nicho ao projeto
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS niche varchar(50) DEFAULT 'infoprodutos';