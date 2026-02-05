-- Fase 2: Melhorias de Performance no Banco de Dados

-- 1. Índice parcial para vendas pagas (otimiza queries de dashboard)
CREATE INDEX IF NOT EXISTS idx_sales_paid_project_date 
ON sales (project_id, sale_date DESC) 
WHERE status = 'paid';

-- 2. Renomear kiwify_sale_id para external_sale_id (abstração multi-plataforma)
ALTER TABLE sales RENAME COLUMN kiwify_sale_id TO external_sale_id;

-- 3. Índices GIN para arrays de product_ids (otimiza filtros de produtos)
CREATE INDEX IF NOT EXISTS idx_projects_kiwify_products 
ON projects USING GIN (kiwify_product_ids);

CREATE INDEX IF NOT EXISTS idx_projects_hotmart_products 
ON projects USING GIN (hotmart_product_ids);

CREATE INDEX IF NOT EXISTS idx_projects_guru_products 
ON projects USING GIN (guru_product_ids);

CREATE INDEX IF NOT EXISTS idx_projects_eduzz_products 
ON projects USING GIN (eduzz_product_ids);

CREATE INDEX IF NOT EXISTS idx_projects_meta_campaigns 
ON projects USING GIN (meta_campaign_ids);

-- 4. Índice adicional para otimizar joins de ad_spend
CREATE INDEX IF NOT EXISTS idx_ad_spend_project_date 
ON ad_spend (project_id, date DESC);

-- 5. Atualizar view sales_public para refletir nova coluna
DROP VIEW IF EXISTS sales_public;
CREATE VIEW sales_public AS
SELECT 
  id,
  project_id,
  amount,
  gross_amount,
  sale_date,
  created_at,
  external_sale_id,
  product_id,
  product_name,
  status,
  payment_method,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term
FROM sales s
WHERE EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.id = s.project_id 
  AND p.is_public = true 
  AND (p.share_token IS NOT NULL OR p.slug IS NOT NULL)
);