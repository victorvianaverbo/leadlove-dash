

## CRM no Painel Admin: Tags + Filtro de Trial/Onboarding

### Objetivo
Evoluir o painel admin existente (`/admin`) com funcionalidades de CRM: sistema de tags por usuario e filtros avancados para identificar usuarios em trial, por plano, status, etc.

### O que sera feito

**1. Nova tabela `user_tags` no banco de dados**
- Armazena tags por usuario (ex: "VIP", "Risco de churn", "Onboarding", "Trial")
- Colunas: `id`, `user_id`, `tag` (texto), `created_at`, `created_by` (quem adicionou)
- RLS: apenas admins podem ler/criar/deletar
- Permite multiplas tags por usuario

**2. Atualizar a Edge Function `admin-users`**
- Buscar tags de cada usuario na query GET
- Novo endpoint para adicionar/remover tags (POST com `action: 'add_tag'` ou `action: 'remove_tag'`)

**3. Evoluir a pagina `/admin` com:**

- **Barra de filtros avancados** abaixo da busca:
  - Filtro por plano (Starter, Pro, Business, Agencia, Sem plano)
  - Filtro por status (Ativo, Trial, Cancelado, Inativo)
  - Filtro por tag (selecao multipla)
  - Botao para limpar filtros

- **Coluna de Tags na tabela**:
  - Exibir badges coloridas com as tags do usuario
  - Botao "+" para adicionar tag (popover com input)
  - Clique na tag para remover

- **Destaque visual para usuarios em Trial**:
  - Badge especial "Trial" visivel na tabela
  - Filtro rapido "Em Trial" para listar quem precisa de onboarding

**4. Componente `UserTagsManager`**
- Componente reutilizavel para gerenciar tags de um usuario
- Permite adicionar tags digitando ou selecionando de tags ja existentes
- Permite remover tags com um clique

### Detalhes tecnicos

**Tabela `user_tags`:**
```text
user_tags
  id          uuid (PK, default gen_random_uuid())
  user_id     uuid (NOT NULL, ref auth.users ON DELETE CASCADE)
  tag         text (NOT NULL)
  created_at  timestamptz (default now())
  created_by  uuid (NOT NULL)
  UNIQUE(user_id, tag)
```

**RLS:**
- SELECT, INSERT, DELETE: apenas `has_role(auth.uid(), 'admin')`

**Fluxo de dados:**
```text
Admin abre /admin
  |
  v
Edge Function busca profiles + projects + overrides + roles + tags
  |
  v
Frontend recebe lista com tags por usuario
  |
  v
Admin filtra por plano/status/tag
  |
  v
Admin adiciona/remove tags via popover
  |
  v
Edge Function persiste no user_tags
```

**Arquivos a criar:**
- `src/components/admin/UserTagsManager.tsx` -- componente de tags
- `src/components/admin/AdminFilters.tsx` -- barra de filtros

**Arquivos a modificar:**
- `supabase/functions/admin-users/index.ts` -- buscar e gerenciar tags
- `src/pages/Admin.tsx` -- integrar filtros, tags e nova coluna
- Migracaoo SQL para criar tabela `user_tags`

### Resultado final
O painel admin tera uma visao CRM completa onde voce podera:
- Ver rapidamente quem esta em trial e precisa de onboarding
- Tagear usuarios como "VIP", "Risco de churn", etc.
- Filtrar por qualquer combinacao de plano + status + tag
- Tudo integrado na mesma pagina que ja existe
