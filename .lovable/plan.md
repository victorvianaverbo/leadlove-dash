
# Correção da Inconsistência de Métricas Entre Dashboards

## Diagnóstico

Após análise detalhada, identifiquei a causa raiz:

### Como funciona hoje

| Dado | Origem | Problema |
|------|--------|----------|
| **Resumo de Ontem** (métricas) | `funnelMetrics` = dados de D1 apenas | ❌ Mostra valores de ontem |
| **Ações Recomendadas** (texto) | `avg3Days.*` = média 3 dias | ✅ Correto |
| **Actions com metric_value** | Valor na resposta da IA (3 dias) | ✅ Correto |

O Connect Rate **39.7%** é o valor de **ontem (D1)**, enquanto **56.3%** é a **média de 3 dias** que aparece no seu dashboard admin.

### A solução

Alterar o `generate-daily-report` para salvar **ambos** os conjuntos de métricas:
1. `metrics` → dados de D1 (para comparação dia a dia)
2. `metrics_avg3days` → média de 3 dias (para análises)

E atualizar o `PublicDashboard.tsx` para:
1. Renomear "Resumo de Ontem" → "Análise dos Últimos 3 Dias"
2. Mostrar as métricas com base em `metrics_avg3days`

---

## Alterações Necessárias

### 1. Edge Function `generate-daily-report/index.ts`

Adicionar campo `metrics_avg3days` ao salvar o relatório:

```typescript
// Save report to database (for yesterday's date)
const { data: report, error: insertError } = await supabase
  .from('daily_reports')
  .upsert({
    project_id: projectId,
    report_date: day1,
    summary: parsedAiResponse.summary,
    comparison: funnelComparison,
    actions: parsedAiResponse.actions || [],
    metrics: funnelMetrics,
    // NOVO: Adicionar métricas de média 3 dias
    metrics_avg3days: {
      revenue: avg3Days.revenue,
      spend: avg3Days.spend,
      roas: avg3Days.roas,
      cpa: avg3Days.cpa,
      salesCount: avg3Days.salesCount,
      hookRate: avg3Days.hookRate,
      holdRate: avg3Days.holdRate,
      closeRate: avg3Days.closeRate,
      connectRate: avg3Days.connectRate,
      ctrRate: avg3Days.ctrRate,
      cpmValue: avg3Days.cpmValue,
      checkoutRate: avg3Days.checkoutRate,
      saleRate: avg3Days.saleRate,
    }
  }, {
    onConflict: 'project_id,report_date',
  });
```

### 2. Banco de Dados

Adicionar coluna `metrics_avg3days` à tabela `daily_reports`:

```sql
ALTER TABLE daily_reports 
ADD COLUMN IF NOT EXISTS metrics_avg3days JSONB DEFAULT NULL;
```

### 3. Frontend `PublicDashboard.tsx`

Atualizar a interface `DailyReport` e a seção de resumo:

**Mudanças:**
- Linha 502: Renomear título para "Análise dos Últimos 3 Dias"
- Linhas 514-543: Usar `latestReport.metrics_avg3days` para exibir métricas
- Adicionar fallback para `metrics` quando `metrics_avg3days` não existir (compatibilidade)

```tsx
// Section 2: Yesterday's Report → 3-Day Analysis
<CardTitle className="text-lg">Análise dos Últimos 3 Dias</CardTitle>

// Usar métricas de 3 dias com fallback para D1
const displayMetrics = latestReport.metrics_avg3days || latestReport.metrics;
<p className="font-semibold text-success">
  {formatCurrency(displayMetrics?.revenue || 0)}
</p>
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-daily-report/index.ts` | Salvar `metrics_avg3days` no relatório |
| **Migração SQL** | Adicionar coluna `metrics_avg3days` |
| `src/pages/PublicDashboard.tsx` | Usar métricas de 3 dias, renomear seção |

---

## Resultado Esperado

Após a correção:
- O dashboard público mostrará **métricas de 3 dias** consistentes com as recomendações
- O título "Análise dos Últimos 3 Dias" deixa claro que são dados consolidados
- Métricas e recomendações estarão sincronizadas (ambos usando avg3Days)
- Compatibilidade mantida com relatórios antigos (fallback para `metrics`)
