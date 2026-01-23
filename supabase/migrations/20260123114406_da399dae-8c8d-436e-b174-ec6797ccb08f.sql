-- Adicionar coluna source na tabela sales para identificar origem
ALTER TABLE sales ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'kiwify';

-- Adicionar arrays de produtos para novas plataformas na tabela projects
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS hotmart_product_ids TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS guru_product_ids TEXT[] DEFAULT '{}';