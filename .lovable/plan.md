

## Corrigir Erro no Dashboard Publico

### Problema
A funcao `sync-public-project` nao esta deployada (retorna erro 404), causando o toast "Erro ao atualizar dados" no dashboard publico. Alem disso, ela ainda usa a logica antiga de budget que nao suporta ABO.

### Solucao

**1. Deploy da funcao `sync-public-project`** - A funcao existe no codigo mas nao foi deployada. Sera feito o deploy.

**2. Aplicar fix de ABO na `sync-public-project`** - A mesma correcao de orcamento (CBO/ABO) que foi aplicada na `sync-project-data` precisa ser replicada na `sync-public-project` (linhas 283-297). Atualmente ela so busca `daily_budget` da campanha. A correcao ira:
   - Tentar buscar budget no nivel da campanha (CBO)
   - Se for 0/null, buscar os ad sets ativos e somar seus budgets (ABO)

### Alteracao tecnica

**Arquivo:** `supabase/functions/sync-public-project/index.ts`

Substituir o bloco de fetch de budgets (linhas 283-297) pela mesma logica ABO implementada em `sync-project-data`:

```typescript
// Fetch daily_budget for each campaign (supports CBO + ABO)
const campaignBudgets: Record<string, number> = {};
for (const campaignId of project.meta_campaign_ids) {
  try {
    // 1. Try campaign-level budget (CBO)
    const campaignUrl = `https://graph.facebook.com/v18.0/${campaignId}?fields=daily_budget,effective_status&access_token=${access_token}`;
    const campaignResponse = await fetch(campaignUrl);
    if (campaignResponse.ok) {
      const campaignData = await campaignResponse.json();
      const isActive = campaignData.effective_status === 'ACTIVE';
      
      if (!isActive) {
        campaignBudgets[campaignId] = 0;
        continue;
      }
      
      if (campaignData.daily_budget && parseFloat(campaignData.daily_budget) > 0) {
        campaignBudgets[campaignId] = parseFloat(campaignData.daily_budget) / 100;
        console.log(`Campaign ${campaignId}: CBO budget=${campaignBudgets[campaignId]}`);
        continue;
      }
      
      // 2. ABO mode - fetch adset budgets
      const adsetsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=daily_budget,effective_status&limit=100&access_token=${access_token}`
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
        campaignBudgets[campaignId] = totalAdsetBudget;
        console.log(`Campaign ${campaignId}: ABO budget=${totalAdsetBudget} (${adsets.length} adsets)`);
      }
    }
  } catch (e) {
    console.error(`Failed to fetch budget for campaign ${campaignId}:`, e);
  }
}
```

**3. Deploy** - Ambas as funcoes serao deployadas: `sync-public-project` e `generate-daily-report`.

### Resultado
O botao "Atualizar" no dashboard publico voltara a funcionar, sincronizando vendas, gastos com anuncios (incluindo budget ABO) e gerando o relatorio de IA.
