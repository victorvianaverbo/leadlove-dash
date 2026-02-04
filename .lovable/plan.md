

# Correção: Orçamento Diário Usando Dados do Dia Mais Recente

## Problema Identificado

A Edge Function está correta e salvando `daily_budget: 0` para campanhas pausadas.
O **banco de dados hoje** mostra corretamente:
- Campanha 120240099092300751 (ACTIVE): R$ 60,00
- Campanha 120240098944500751 (ACTIVE): R$ 105,00
- **Total correto: R$ 165,00**

Mas o **frontend** soma budgets de todos os dias no período, incluindo dados históricos de quando campanhas pausadas ainda tinham budget > 0.

Código atual (linhas 420-427 de `ProjectView.tsx`):
```typescript
const uniqueCampaignBudgets = new Map<string, number>();
filteredAdSpend?.forEach(a => {
  if (a.campaign_id && a.daily_budget && !uniqueCampaignBudgets.has(a.campaign_id)) {
    uniqueCampaignBudgets.set(a.campaign_id, a.daily_budget);
  }
});
```

Problema: Pega o primeiro `daily_budget` encontrado para cada campanha, mas se os dados vierem ordenados de forma inconsistente ou o filtro de período incluir dados antigos, valores errados são usados.

---

## Solução

Modificar o cálculo para usar **apenas os registros do dia mais recente** disponível nos dados filtrados.

### Alteração em `src/pages/ProjectView.tsx`

**De (linhas 420-427):**
```typescript
const uniqueCampaignBudgets = new Map<string, number>();
filteredAdSpend?.forEach(a => {
  if (a.campaign_id && a.daily_budget && !uniqueCampaignBudgets.has(a.campaign_id)) {
    uniqueCampaignBudgets.set(a.campaign_id, a.daily_budget);
  }
});
const dailyBudget = Array.from(uniqueCampaignBudgets.values()).reduce((sum, b) => sum + b, 0);
```

**Para:**
```typescript
// Get daily budget from the most recent date only (reflects current campaign status)
const mostRecentDate = filteredAdSpend?.length 
  ? filteredAdSpend.reduce((max, a) => (a.date > max ? a.date : max), filteredAdSpend[0].date)
  : null;

const uniqueCampaignBudgets = new Map<string, number>();
filteredAdSpend?.forEach(a => {
  // Only use budget from the most recent date to reflect current active campaigns
  if (a.date === mostRecentDate && a.campaign_id && !uniqueCampaignBudgets.has(a.campaign_id)) {
    uniqueCampaignBudgets.set(a.campaign_id, a.daily_budget || 0);
  }
});
const dailyBudget = Array.from(uniqueCampaignBudgets.values()).reduce((sum, b) => sum + b, 0);
```

---

## Comportamento Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Dados de hoje + históricos | Soma todos (R$ 355) | Usa apenas hoje (R$ 165) |
| Campanha pausada hoje | Pode usar budget antigo | Usa R$ 0,00 |
| Campanhas ativas | Pode duplicar | Apenas do dia atual |

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ProjectView.tsx` | Linhas 420-427: Filtrar por data mais recente |

---

## Resultado Esperado

O KPI "Orçamento Diário" mostrará **R$ 165,00** (soma apenas das 2 campanhas ativas no dia mais recente), não mais a soma incorreta que incluía campanhas pausadas de dias anteriores.

