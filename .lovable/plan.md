

# Plano: Adicionar kiwify_ticket_price à View projects_public

## Problema Identificado

A view `projects_public` não inclui a coluna `kiwify_ticket_price`:

```sql
-- View atual (falta kiwify_ticket_price)
CREATE VIEW public.projects_public AS
  SELECT 
    id, name, description, slug, is_public, share_token,
    created_at, updated_at, last_sync_at, kiwify_product_ids,
    meta_campaign_ids, benchmark_engagement, benchmark_ctr,
    benchmark_lp_rate, benchmark_checkout_rate, benchmark_sale_rate,
    campaign_objective, ad_type, account_status, investment_value,
    class_date, use_gross_for_roas  -- <-- FALTA kiwify_ticket_price!
  FROM public.projects
  WHERE is_public = true;
```

O código em `PublicDashboard.tsx` tenta ler `project.kiwify_ticket_price` mas a view retorna `null` porque o campo não está incluído.

## Solução

Criar uma migração para atualizar a view `projects_public` incluindo o campo `kiwify_ticket_price`.

## Mudança Técnica

**Nova migração SQL:**

```sql
-- Drop and recreate the view to include kiwify_ticket_price
DROP VIEW IF EXISTS public.projects_public;

CREATE VIEW public.projects_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    name,
    description,
    slug,
    is_public,
    share_token,
    created_at,
    updated_at,
    last_sync_at,
    kiwify_product_ids,
    meta_campaign_ids,
    benchmark_engagement,
    benchmark_ctr,
    benchmark_lp_rate,
    benchmark_checkout_rate,
    benchmark_sale_rate,
    campaign_objective,
    ad_type,
    account_status,
    investment_value,
    class_date,
    use_gross_for_roas,
    kiwify_ticket_price  -- NOVO CAMPO
  FROM public.projects
  WHERE is_public = true AND (share_token IS NOT NULL OR slug IS NOT NULL);
```

## Resultado Esperado

Após a migração:
1. O dashboard público da Adri vai ler `kiwify_ticket_price = 27`
2. O cálculo de faturamento vai usar **57 vendas × R$27 = R$1.539,00**
3. Todos os projetos com ticket price configurado vão funcionar corretamente no dashboard público

## Verificação

| Projeto | Ticket Price | Resultado Esperado |
|---------|--------------|-------------------|
| Sexólogo | R$27 | Faturamento = vendas × 27 |
| Adri | R$27 | Faturamento = vendas × 27 |

