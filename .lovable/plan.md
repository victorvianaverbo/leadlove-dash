
# Plano: Melhorar Ações Recomendadas com Contexto Completo do Funil

## Problema Atual

A seção "Ações Recomendadas" mostra apenas ações de vídeo sem explicar o PORQUÊ de cada recomendação:
- Não mostra qual métrica está ruim
- Não mostra o valor atual vs benchmark
- Não apresenta todas as etapas do funil

## Solucao Proposta

### 1. Melhorar o Prompt da IA

Atualizar `supabase/functions/generate-daily-report/index.ts` para que a IA:
- Analise TODAS as 8 metricas do funil (nao so video)
- Inclua na acao o CONTEXTO (qual metrica, valor atual, benchmark)
- Priorize por impacto no ROI

**Novo formato de acao:**
```json
{
  "action": "Reescrever hook com pergunta provocativa nos primeiros 3 segundos",
  "priority": "alta",
  "metric": "hook_rate",
  "metric_value": "15.2%",
  "benchmark": "20%",
  "reason": "Hook Rate critico - apenas 15.2% das pessoas assistem alem dos 3 segundos (meta: 20%)"
}
```

### 2. Atualizar Exibicao no Dashboard

Modificar `src/pages/PublicDashboard.tsx` para mostrar o contexto:

**Layout proposto para cada acao:**
```
+------------------------------------------------------------------+
|  [Badge METRICA: Hook Rate 15.2% (meta: 20%)]      [ALTA]        |
|  ----------------------------------------------------------------|
|  Reescrever hook com pergunta provocativa nos primeiros 3 seg.   |
+------------------------------------------------------------------+
```

### Mudancas Tecnicas

**Arquivo: `supabase/functions/generate-daily-report/index.ts`**

1. Atualizar o formato JSON pedido a IA (linhas 477-498):

```typescript
"actions": [
  {
    "action": "Descricao da acao especifica",
    "priority": "alta",
    "metric": "hook_rate",
    "metric_label": "Hook Rate",
    "metric_value": "15.2%",
    "benchmark": "20%",
    "reason": "Frase curta explicando porque isso e problema"
  }
]
```

2. Adicionar instrucao para IA analisar TODAS as metricas:
- Hook Rate, Hold Rate, Close Rate (video)
- Connect Rate, CTR (cliques)
- Taxa Conversao LP, Taxa Checkout (conversao)
- CPM (custo)

3. Priorizar acoes pelo impacto:
- ALTA: Metricas criticas que afetam tudo (Hook, Hold)
- MEDIA: Metricas intermediarias (Connect, CTR)
- BAIXA: Otimizacoes especificas (Checkout, CPM)

**Arquivo: `src/pages/PublicDashboard.tsx`**

Atualizar o card de Acoes Recomendadas (linhas 594-600):

```tsx
{latestReport.actions.map((item, index) => (
  <div key={index} className="bg-muted/50 rounded-lg p-4 border space-y-2">
    {/* Linha 1: Metrica + Prioridade */}
    <div className="flex items-center justify-between">
      <Badge variant="secondary" className="text-xs">
        {item.metric_label}: {item.metric_value} (meta: {item.benchmark})
      </Badge>
      <PriorityBadge priority={item.priority} />
    </div>
    {/* Linha 2: Acao */}
    <div className="flex items-start gap-2">
      <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
      <span className="text-sm">{item.action}</span>
    </div>
    {/* Linha 3: Motivo (opcional) */}
    {item.reason && (
      <p className="text-xs text-muted-foreground pl-6">{item.reason}</p>
    )}
  </div>
))}
```

## Exemplo de Saida Esperada

Antes:
```
[x] Reescrever hook verbal com pergunta provocativa...  [alta]
[x] Testar pattern interrupt visual...                  [alta]
```

Depois:
```
+------------------------------------------------------------------+
| Hook Rate: 15.2% (meta: 20%)                           [ALTA]    |
| [x] Reescrever hook verbal com pergunta provocativa nos 3 seg    |
|     Apenas 15% das pessoas passam dos 3 segundos do video        |
+------------------------------------------------------------------+
| Connect Rate: 58% (meta: 60%)                          [MEDIA]   |
| [x] Verificar velocidade da pagina e otimizar mobile             |
|     42% dos cliques nao chegam na pagina de destino              |
+------------------------------------------------------------------+
| Taxa Checkout: 35% (meta: 40%)                         [BAIXA]   |
| [x] Simplificar formulario e adicionar mais formas de pagamento  |
|     Abandono no checkout esta acima do normal                    |
+------------------------------------------------------------------+
```

## Cronograma

| Fase | Descricao | Tempo |
|------|-----------|-------|
| 1 | Atualizar prompt da IA com novo formato | 15 min |
| 2 | Atualizar exibicao no PublicDashboard | 10 min |
| 3 | Deploy e teste | 5 min |

**Total estimado:** ~30 minutos

## Resultado

Apos implementacao:
1. Usuario entende PORQUE cada acao foi recomendada
2. Ve qual metrica esta ruim e quanto precisa melhorar
3. Acoes cobrem TODAS as etapas do funil (nao so video)
4. Prioridades claras por impacto no ROI
