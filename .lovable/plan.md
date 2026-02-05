
# Plano: Corrigir Integração Eduzz + Melhorias de Escalabilidade

## ✅ Fase 1: Corrigir Eduzz (CONCLUÍDA)

- [x] Adicionar `eduzz` ao tipo e config em `SalesIntegrationCard.tsx`
- [x] Adicionar state `eduzzProducts` + card Eduzz em `ProjectEdit.tsx`
- [x] Salvar `eduzz_product_ids` no update do projeto

---

## ✅ Fase 2: Melhorias de Alta Prioridade (CONCLUÍDA)

| # | Ação | Status |
|---|------|--------|
| 1 | Criar índice parcial `idx_sales_paid_project_date WHERE status = 'paid'` | ✅ |
| 2 | Renomear `kiwify_sale_id` → `external_sale_id` | ✅ |
| 3 | Adicionar índices GIN para arrays de product_ids | ✅ |
| 4 | Criar índice `idx_ad_spend_project_date` para otimizar joins | ✅ |
| 5 | Atualizar view `sales_public` com security_invoker | ✅ |
| 6 | Atualizar código das edge functions para usar `external_sale_id` | ✅ |
| 7 | Atualizar constraint única para `external_sale_id` | ✅ |

---

## Fase 3: Melhorias de Média Prioridade (PRÓXIMAS)

| # | Ação | Esforço |
|---|------|---------|
| 4 | Otimizar queries N+1 do Dashboard | 4h |
| 5 | Error Boundaries granulares | 2h |
| 6 | Rate limiting por usuário | 1 dia |

---

## Fase 4: Escalabilidade Futura

| # | Ação | Quando |
|---|------|--------|
| 7 | Sistema de filas (pg_notify ou BullMQ) | > 500 usuários |
| 8 | Particionamento de tabelas | > 1M registros |
| 9 | Servidor dedicado (Railway/Fly.io) | > 1000 usuários |

---

## Notas de Segurança

Os warnings restantes são pré-existentes e não são críticos:
- **Function Search Path Mutable**: Funções internas do Supabase
- **Leaked Password Protection**: Pode ser habilitado via dashboard de auth
