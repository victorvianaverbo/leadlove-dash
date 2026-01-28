
# Plano de Correção - Sincronização de Vendas Guru e Hotmart

## Problema Identificado

O projeto **Medsimple** tem **0 vendas sincronizadas** apesar de ter integrações Hotmart (36 produtos) e Guru (18 produtos) configuradas corretamente. Os logs revelam dois erros críticos nas APIs:

### Erro 1: Guru DMG - Parâmetros de Data Incorretos
A API v2 do Guru **não aceita** `start_date` e `end_date`. Ela requer:
- `confirmed_at_ini` / `confirmed_at_end` (formato: `YYYY-MM-DD`)
- Ou `ordered_at_ini` / `ordered_at_end`

### Erro 2: Hotmart - Parâmetro Inválido
Alguns product_ids podem estar em formato incorreto ou referenciando produtos inativos/ofertas.

---

## Correções Propostas

### 1. Corrigir Endpoint da API Guru

**Arquivo:** `supabase/functions/sync-project-data/index.ts`

Alterar de:
```text
/api/v2/transactions?product_id=${productId}&start_date=${startDate}&end_date=${endDate}
```

Para:
```text
/api/v2/transactions?product_id=${productId}&confirmed_at_ini=${startDate}&confirmed_at_end=${endDate}
```

### 2. Adicionar Tratamento de Erro Robusto para Hotmart

- Continuar processando outros produtos mesmo quando um falhar
- Logar quais produtos específicos falharam para diagnóstico
- Verificar se o product_id é numérico (Hotmart usa IDs numéricos)

### 3. Adicionar Retry com Parâmetros Alternativos para Guru

Se `confirmed_at_ini` falhar, tentar com `ordered_at_ini` como fallback.

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `supabase/functions/sync-project-data/index.ts` | Corrigir parâmetros da API Guru (linha ~455) |
| `supabase/functions/sync-project-data/index.ts` | Melhorar tratamento de erros Hotmart (linha ~371) |

---

## Detalhes Técnicos da Correção

### Função syncGuru - Linha 454-455

**Antes:**
```typescript
const salesResponse = await fetchWithRetry(
  `https://digitalmanager.guru/api/v2/transactions?product_id=${productId}&start_date=${startDate}&end_date=${endDate}&page=${page}&per_page=100`,
```

**Depois:**
```typescript
const salesResponse = await fetchWithRetry(
  `https://digitalmanager.guru/api/v2/transactions?product_id=${productId}&confirmed_at_ini=${startDate}&confirmed_at_end=${endDate}&page=${page}&per_page=100`,
```

### Função syncHotmart - Melhorar Logs

Adicionar log mais detalhado para identificar quais produtos estão falhando e por quê, sem interromper a sincronização dos demais.

---

## Próximos Passos Após Correção

1. Deploy da edge function atualizada
2. Executar sincronização manual do projeto Medsimple
3. Verificar logs para confirmar que vendas estão sendo capturadas
4. Validar dados no banco

---

## Resultado Esperado

Após a correção:
- Vendas do Guru serão sincronizadas corretamente usando `confirmed_at_ini`
- Erros de produtos individuais do Hotmart não bloquearão a sincronização dos demais
- Logs mais claros para diagnóstico futuro
