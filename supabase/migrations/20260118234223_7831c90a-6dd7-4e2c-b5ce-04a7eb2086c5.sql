-- Criar tabela para relatórios diários gerados pela IA
CREATE TABLE public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  summary TEXT NOT NULL,
  comparison JSONB,
  actions JSONB,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, report_date)
);

-- Índice para busca rápida por projeto e data
CREATE INDEX idx_daily_reports_project_date ON public.daily_reports(project_id, report_date DESC);

-- Habilitar RLS
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Política: Leitura pública para projetos públicos
CREATE POLICY "Public can view reports of shared projects"
  ON public.daily_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = daily_reports.project_id
      AND projects.is_public = true
      AND (projects.share_token IS NOT NULL OR projects.slug IS NOT NULL)
    )
  );

-- Política: Usuários podem ver seus próprios relatórios
CREATE POLICY "Users can view own reports"
  ON public.daily_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = daily_reports.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Habilitar extensões para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;