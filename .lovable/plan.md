

## Corrigir Orcamento Diario nao aparecendo

### Problema
O orcamento diario mostra R$ 0,00 porque o budget esta configurado no **nivel do conjunto de anuncios (ad set)**, nao no nivel da campanha. A Meta Ads tem dois modos:
- **CBO** (Campaign Budget Optimization): budget no nivel da campanha
- **ABO** (Ad Set Budget Optimization): budget no nivel do ad set

O codigo atual so busca `daily_budget` da campanha. Quando o budget esta nos ad sets, retorna null/0.

### Evidencia nos logs
```
Campaign 120239455667990033: status=ACTIVE, budget=0
```
A campanha esta ativa mas budget=0 porque usa ABO.

### Solucao
Modificar a funcao `syncMetaAds` em `sync-project-data/index.ts` para:

1. Primeiro tentar buscar `daily_budget` da campanha (CBO)
2. Se for 0/null, buscar os ad sets da campanha via `/adsets?fields=daily_budget,effective_status`
3. Somar o `daily_budget` dos ad sets ativos

### Alteracao tecnica

**Arquivo:** `supabase/functions/sync-project-data/index.ts`

Na secao que busca budgets das campanhas (linhas ~785-810), alterar a logica para:

```typescript
const budgetPromises = campaignIds.map(async (campaignId) => {
  try {
    // 1. Try campaign-level budget (CBO)
    const campaignResponse = await fetch(
      `https://graph.facebook.com/v18.0/${campaignId}?fields=daily_budget,effective_status&access_token=${credentials.access_token}`
    );
    if (campaignResponse.ok) {
      const campaignData = await campaignResponse.json();
      const isActive = campaignData.effective_status === 'ACTIVE';
      
      if (!isActive) {
        return { campaignId, budget: 0 };
      }
      
      // If campaign has daily_budget (CBO mode), use it
      if (campaignData.daily_budget && parseFloat(campaignData.daily_budget) > 0) {
        const budget = parseFloat(campaignData.daily_budget) / 100;
        console.log(`[META] Campaign ${campaignId}: CBO budget=${budget}`);
        return { campaignId, budget };
      }
      
      // 2. No campaign budget = ABO mode. Fetch adset budgets
      const adsetsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=daily_budget,effective_status&limit=100&access_token=${credentials.access_token}`
      );
      if (adsetsResponse.ok) {
        const adsetsData = await adsetsResponse.json();
        const adsets = adsetsData.data || [];
        let totalAdsetBudget = 0;
        for (const adset of adsets) {
          if (adset.effective_status === 'ACTIVE' && adset.daily_budget) {
            totalAdsetBudget += parseFloat(adset.daily_budget) / 100;
          }
        }
        console.log(`[META] Campaign ${campaignId}: ABO budget=${totalAdsetBudget} (${adsets.length} adsets)`);
        return { campaignId, budget: totalAdsetBudget };
      }
    }
  } catch (e) {
    console.error(`[META] Failed to fetch budget for campaign ${campaignId}`);
  }
  return { campaignId, budget: 0 };
});
```

### Resultado
Apos essa alteracao, o KPI "Orcamento Diario" exibira o valor correto independentemente de o budget estar configurado no nivel da campanha (CBO) ou do conjunto de anuncios (ABO).

