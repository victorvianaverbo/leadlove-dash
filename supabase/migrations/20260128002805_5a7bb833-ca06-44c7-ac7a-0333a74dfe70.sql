-- Tabela para cache de métricas calculadas por projeto e data
CREATE TABLE IF NOT EXISTS public.metrics_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cache_date date NOT NULL,
  date_range text NOT NULL DEFAULT '30d', -- today, yesterday, 7d, 30d, 90d, all
  metrics jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, cache_date, date_range)
);

-- Índices para acesso rápido
CREATE INDEX IF NOT EXISTS idx_metrics_cache_project_date 
ON metrics_cache(project_id, cache_date DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_cache_updated 
ON metrics_cache(updated_at);

-- Enable RLS
ALTER TABLE public.metrics_cache ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only view metrics for their own projects
CREATE POLICY "Users can view own metrics cache"
ON public.metrics_cache
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = metrics_cache.project_id 
  AND projects.user_id = auth.uid()
));

-- RLS: Allow anon to view metrics cache for public projects
CREATE POLICY "Anon can view metrics cache of shared projects"
ON public.metrics_cache
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = metrics_cache.project_id 
  AND projects.is_public = true 
  AND (projects.share_token IS NOT NULL OR projects.slug IS NOT NULL)
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_metrics_cache_updated_at
BEFORE UPDATE ON public.metrics_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();