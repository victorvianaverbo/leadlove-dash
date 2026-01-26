-- Corrigir políticas RLS para isolamento de dados
-- Projetos públicos devem ser visíveis APENAS para usuários não autenticados (anon)

-- 1. PROJECTS: Dropar políticas públicas permissivas e recriar restritas ao anon
DROP POLICY IF EXISTS "Public can view shared projects" ON projects;
DROP POLICY IF EXISTS "Public can view shared projects by slug" ON projects;

CREATE POLICY "Anon can view shared projects by token"
ON projects FOR SELECT TO anon
USING (is_public = true AND share_token IS NOT NULL);

CREATE POLICY "Anon can view shared projects by slug"
ON projects FOR SELECT TO anon
USING (is_public = true AND slug IS NOT NULL);

-- 2. SALES: Dropar política pública e recriar para anon
DROP POLICY IF EXISTS "Public can view sales of shared projects" ON sales;

CREATE POLICY "Anon can view sales of shared projects"
ON sales FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM projects
  WHERE projects.id = sales.project_id
  AND projects.is_public = true
  AND (projects.share_token IS NOT NULL OR projects.slug IS NOT NULL)
));

-- 3. AD_SPEND: Dropar política pública e recriar para anon
DROP POLICY IF EXISTS "Public can view ad_spend of shared projects" ON ad_spend;

CREATE POLICY "Anon can view ad_spend of shared projects"
ON ad_spend FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM projects
  WHERE projects.id = ad_spend.project_id
  AND projects.is_public = true
  AND projects.share_token IS NOT NULL
));

-- 4. DAILY_REPORTS: Dropar política pública e recriar para anon
DROP POLICY IF EXISTS "Public can view reports of shared projects" ON daily_reports;

CREATE POLICY "Anon can view reports of shared projects"
ON daily_reports FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM projects
  WHERE projects.id = daily_reports.project_id
  AND projects.is_public = true
  AND (projects.share_token IS NOT NULL OR projects.slug IS NOT NULL)
));