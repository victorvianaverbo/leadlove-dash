

# Correção: Divisão Dinâmica Baseada em Dias com Dados

## Problema Identificado

O cálculo atual (linhas 274-291) **sempre divide por 3**, mesmo quando só há dados de 2 ou 1 dia:

```typescript
// Atual - PROBLEMA
const avg3Days = {
  connectRate: (d1.connectRate + d2.connectRate + d3.connectRate) / 3,  // ← Divide por 3 sempre
  // ...
};
```

Se você iniciou o tráfego há 2 dias:
- D1 (ontem): Connect = 68.9%
- D2 (anteontem): Connect = 50.0%
- D3 (3 dias atrás): Connect = 0% (sem dados)
- **Média atual**: (68.9 + 50.0 + 0) / 3 = **39.6%** ❌
- **Média correta**: (68.9 + 50.0) / 2 = **59.5%** ✅

---

## Solução

Detectar quantos dias têm dados significativos (impressions > 0 ou spend > 0) e dividir apenas por esse número.

### Alteração em `supabase/functions/generate-daily-report/index.ts`

**Após linha 271 (depois do `d3 = calcDayMetrics(...)`)**, adicionar lógica para contar dias com dados:

```typescript
const d1 = calcDayMetrics(day1Sales, day1AdSpend);
const d2 = calcDayMetrics(day2Sales, day2AdSpend);
const d3 = calcDayMetrics(day3Sales, day3AdSpend);

// Detectar quantos dias têm dados significativos
const hasD1Data = d1.impressions > 0 || d1.spend > 0 || d1.salesCount > 0;
const hasD2Data = d2.impressions > 0 || d2.spend > 0 || d2.salesCount > 0;
const hasD3Data = d3.impressions > 0 || d3.spend > 0 || d3.salesCount > 0;

// Contar dias com dados (mínimo 1 para evitar divisão por zero)
const daysWithData = Math.max(1, (hasD1Data ? 1 : 0) + (hasD2Data ? 1 : 0) + (hasD3Data ? 1 : 0));

console.log(`Days with data: ${daysWithData} (D1: ${hasD1Data}, D2: ${hasD2Data}, D3: ${hasD3Data})`);

// Calculate averages using only days with data
const avg3Days = {
  engagementRate: (d1.engagementRate + d2.engagementRate + d3.engagementRate) / daysWithData,
  ctrRate: (d1.ctrRate + d2.ctrRate + d3.ctrRate) / daysWithData,
  lpRate: (d1.lpRate + d2.lpRate + d3.lpRate) / daysWithData,
  checkoutRate: (d1.checkoutRate + d2.checkoutRate + d3.checkoutRate) / daysWithData,
  saleRate: (d1.saleRate + d2.saleRate + d3.saleRate) / daysWithData,
  revenue: (d1.revenue + d2.revenue + d3.revenue) / daysWithData,
  spend: (d1.spend + d2.spend + d3.spend) / daysWithData,
  roas: (d1.roas + d2.roas + d3.roas) / daysWithData,
  cpa: (d1.cpa + d2.cpa + d3.cpa) / daysWithData,
  salesCount: (d1.salesCount + d2.salesCount + d3.salesCount) / daysWithData,
  hookRate: (d1.hookRate + d2.hookRate + d3.hookRate) / daysWithData,
  holdRate: (d1.holdRate + d2.holdRate + d3.holdRate) / daysWithData,
  closeRate: (d1.closeRate + d2.closeRate + d3.closeRate) / daysWithData,
  connectRate: (d1.connectRate + d2.connectRate + d3.connectRate) / daysWithData,
  cpmValue: (d1.cpmValue + d2.cpmValue + d3.cpmValue) / daysWithData,
};
```

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-daily-report/index.ts` | Adicionar detecção de dias com dados e usar `daysWithData` como divisor |

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| 3 dias de tráfego | (D1+D2+D3)/3 | (D1+D2+D3)/3 ✅ |
| 2 dias de tráfego | (D1+D2+0)/3 ❌ | (D1+D2)/2 ✅ |
| 1 dia de tráfego | (D1+0+0)/3 ❌ | (D1)/1 ✅ |

Para o projeto Roberley (2 dias de dados):
- Connect Rate: passará de **39.7%** para **~59%** (consistente com admin)

