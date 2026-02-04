

# Correções: Orçamento Diário e Filtro de Vendas Multi-Plataforma

## Problemas Identificados

### 1. Orçamento Diário não soma múltiplas campanhas

**Código atual (linha 410)**:
```typescript
const dailyBudget = filteredAdSpend?.[0]?.daily_budget || 0;
```

Isso pega apenas o orçamento da primeira campanha, ignorando as demais quando várias estão selecionadas.

### 2. Vendas Hotmart/Guru não aparecem no dashboard

**Código atual (linha 367-369)**:
```typescript
const filteredSales = sales?.filter(s => 
  !project?.kiwify_product_ids?.length || project.kiwify_product_ids.includes(s.product_id)
);
```

Este filtro verifica **apenas** `kiwify_product_ids`, excluindo vendas de Hotmart e Guru do dashboard.

---

## Solução

### Alteração 1: Somar orçamentos de todas as campanhas selecionadas

**De:**
```typescript
const dailyBudget = filteredAdSpend?.[0]?.daily_budget || 0;
```

**Para:**
```typescript
// Sum daily budgets from all unique campaigns (avoid duplicates from multiple days)
const uniqueCampaignBudgets = new Map<string, number>();
filteredAdSpend?.forEach(a => {
  if (a.campaign_id && a.daily_budget && !uniqueCampaignBudgets.has(a.campaign_id)) {
    uniqueCampaignBudgets.set(a.campaign_id, a.daily_budget);
  }
});
const dailyBudget = Array.from(uniqueCampaignBudgets.values()).reduce((sum, b) => sum + b, 0);
```

### Alteração 2: Filtrar vendas de todas as plataformas

**De:**
```typescript
const filteredSales = sales?.filter(s => 
  !project?.kiwify_product_ids?.length || project.kiwify_product_ids.includes(s.product_id)
);
```

**Para:**
```typescript
const filteredSales = sales?.filter(s => {
  // Combine all product IDs from all platforms
  const kiwifyIds = project?.kiwify_product_ids || [];
  const hotmartIds = (project as any)?.hotmart_product_ids || [];
  const guruIds = (project as any)?.guru_product_ids || [];
  
  const allProductIds = [...kiwifyIds, ...hotmartIds, ...guruIds];
  
  // If no products selected in any platform, show all sales
  if (allProductIds.length === 0) return true;
  
  // Include sales that match any selected product from any platform
  return allProductIds.includes(s.product_id);
});
```

---

## Arquivo a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/ProjectView.tsx` | Linha 367-369: Atualizar filtro de vendas multi-plataforma |
| `src/pages/ProjectView.tsx` | Linha 409-410: Somar orçamentos de campanhas únicas |

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| **3 campanhas selecionadas** (R$50 + R$100 + R$150) | R$ 50 | **R$ 300** |
| **Vendas Hotmart/Guru** | Não aparecem | **Aparecem no dashboard** |
| **Projeto multi-checkout** (Kiwify + Hotmart) | Apenas Kiwify | **Todas as vendas** |

---

## Seção Técnica

### Por que usar Map para orçamentos?

Cada campanha gera múltiplos registros `ad_spend` (um por dia). Sem usar um Map para deduplicar por `campaign_id`, o orçamento seria somado incorretamente múltiplas vezes:

```text
Campanha A: 30 registros (30 dias) × R$100 = R$3000 ❌
Campanha A: 1 valor único × R$100 = R$100 ✅
```

### Compatibilidade com tipos

Os campos `hotmart_product_ids` e `guru_product_ids` existem no banco mas podem não estar tipados. Usamos `(project as any)` para acessá-los de forma segura.

