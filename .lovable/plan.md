# Plano de Implementação: Análise de Funil com IA - MetrikaPRO v2.0

## ✅ Status: IMPLEMENTADO

## Resumo das Mudanças Realizadas

### Fase 1: Migração de Banco ✅
- Adicionadas colunas `video_p25_views`, `video_p50_views`, `video_p75_views`, `video_p100_views` na tabela `ad_spend`
- Adicionada coluna `niche` na tabela `projects`

### Fase 2: Edge Functions de Sync ✅
- `sync-project-data`: Atualizado para buscar novas métricas de vídeo da API Meta
- `sync-public-project`: Atualizado com as mesmas mudanças

### Fase 3: Prompt da IA ✅
- `generate-daily-report`: Atualizado com novo prompt completo incluindo:
  - 8 métricas de funil: Hook, Hold, Close, Connect, CTR, CPM, Taxa Conversão, Taxa Checkout
  - Benchmarks por nível: Crítico, Atenção, Bom, Excelente
  - Planos de ação específicos para cada problema
  - Output JSON estruturado com métricas e recomendações

## Métricas Implementadas

| Métrica | Fórmula | Crítico | Atenção | Bom | Excelente |
|---------|---------|---------|---------|-----|-----------|
| Hook Rate | (Views 3s / Impressões) × 100 | < 20% | 20-35% | 35-50% | > 50% |
| Hold Rate | (Views 75% / Views 25%) × 100 | < 40% | 40-60% | 60-75% | > 75% |
| Close Rate | (Views 100% / Views 75%) × 100 | < 50% | 50-70% | 70-85% | > 85% |
| Connect Rate | (LP Views / Link Clicks) × 100 | < 60% | 60-75% | 75-90% | > 90% |
| CTR | (Link Clicks / Impressões) × 100 | < 0.8% | 0.8-1.5% | 1.5-3% | > 3% |
| CPM | (Gasto / Impressões) × 1000 | > R$ 50 | R$ 30-50 | R$ 15-30 | < R$ 15 |
| Taxa Conversão LP | (Vendas / LP Views) × 100 | < 1% | 1-3% | 3-7% | > 7% |
| Taxa Checkout | (Vendas / Checkouts) × 100 | < 40% | 40-60% | 60-80% | > 80% |

## Planos de Ação por Problema

### Hook Baixo (< 20%)
- Otimizar thumbnail com contraste alto
- Reescrever hook verbal com pergunta provocativa
- Testar pattern interrupt visual

### Hold Baixo (< 40%)
- Encurtar vídeo em 30-40%
- Adicionar cortes a cada 2-3 segundos
- Criar micro-hooks no meio

### Close Baixo (< 50%)
- Fortalecer CTA com verbos de ação
- Criar urgência e escassez
- Reforçar CTA visualmente

### Connect Rate Baixo (< 60%)
- Verificar velocidade da página (< 3s)
- Testar links e redirects
- Otimizar para mobile

### CTR Baixo (< 0.8%)
- Mencionar CTA múltiplas vezes
- Melhorar oferta com isca digital
- Qualificar melhor o público

### CPM Alto (> R$ 50)
- Expandir público-alvo
- Melhorar qualidade do criativo
- Testar outros posicionamentos

### Taxa Conversão Baixa (< 1%)
- Otimizar copy da página
- Adicionar elementos de confiança
- Simplificar processo de compra

### Taxa Checkout Baixa (< 40%)
- Simplificar checkout
- Transparência total de custos
- Recuperar carrinhos abandonados
