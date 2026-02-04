

# Orçamento Diário: Considerar Apenas Campanhas Ativas

## Problema Atual

O orçamento diário exibido no dashboard soma o `daily_budget` de **todas** as campanhas configuradas, incluindo campanhas pausadas, arquivadas ou desativadas. Isso gera um valor incorreto que não reflete o gasto real projetado.

## Solução

Modificar a sincronização Meta Ads para verificar o `effective_status` da campanha antes de atribuir o `daily_budget`. Apenas campanhas com status `ACTIVE` terão seu orçamento computado.

---

## Alterações Necessárias

### Arquivo: `supabase/functions/sync-project-data/index.ts`

**Linha 590-608** - Modificar busca de budgets para incluir `effective_status`:

```text
De:
┌─────────────────────────────────────────────────────────────────────┐
│ campaignId?fields=daily_budget                                     │
│ return { campaignId, budget: ... }                                 │
└─────────────────────────────────────────────────────────────────────┘

Para:
┌─────────────────────────────────────────────────────────────────────┐
│ campaignId?fields=daily_budget,effective_status                    │
│ Se effective_status !== 'ACTIVE' → budget = 0                      │
│ Apenas campanhas ativas terão budget > 0                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Lógica Detalhada

```typescript
// Fetch daily_budget AND effective_status for each campaign
const budgetPromises = campaignIds.map(async (campaignId) => {
  try {
    const campaignResponse = await fetch(
      `https://graph.facebook.com/v18.0/${campaignId}?fields=daily_budget,effective_status&access_token=${credentials.access_token}`
    );
    if (campaignResponse.ok) {
      const campaignData = await campaignResponse.json();
      
      // Only count budget for ACTIVE campaigns
      const isActive = campaignData.effective_status === 'ACTIVE';
      const budget = isActive && campaignData.daily_budget 
        ? parseFloat(campaignData.daily_budget) / 100 
        : 0;
      
      console.log(`[META] Campaign ${campaignId}: status=${campaignData.effective_status}, budget=${budget}`);
      
      return { campaignId, budget };
    }
  } catch (e) {
    console.error(`[META] Failed to fetch budget for campaign ${campaignId}`);
  }
  return { campaignId, budget: 0 };
});
```

---

## Comportamento Esperado

| Status da Campanha | `daily_budget` na Meta | Resultado no Dashboard |
|--------------------|------------------------|------------------------|
| `ACTIVE`           | R$ 100,00              | **R$ 100,00** ✅        |
| `PAUSED`           | R$ 100,00              | **R$ 0,00** (ignorado) |
| `DELETED`          | R$ 50,00               | **R$ 0,00** (ignorado) |
| `ARCHIVED`         | R$ 75,00               | **R$ 0,00** (ignorado) |

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/sync-project-data/index.ts` | Linhas 590-608: Adicionar `effective_status` à query e filtrar campanhas não-ativas |

---

## Resultado Esperado

O KPI "Orçamento Diário" no dashboard mostrará apenas a soma dos orçamentos de campanhas que estão **efetivamente rodando**, refletindo o gasto real projetado para o dia.

---

## Seção Técnica

### Por que usar `effective_status` e não `status`?

A Meta tem dois campos de status:
- **`status`**: O que o usuário configurou (pode ser ACTIVE mesmo se a conta estiver pausada)
- **`effective_status`**: O estado real considerando hierarquia (conta → campanha → conjunto → anúncio)

Uma campanha pode ter `status: ACTIVE` mas `effective_status: CAMPAIGN_PAUSED` se o usuário pausou via BM. Por isso, `effective_status` é o campo correto.

