

# Plano de Implementacao: Analise de Funil com IA - MetrikaPRO v2.0

## Resumo Executivo

Este plano implementa as melhorias definidas no PRD para transformar a analise de funil com IA do MetrikaPRO em um sistema mais robusto, com metricas de engajamento de video (Hook, Hold, Close), Connect Rate, benchmarks atualizados e planos de acao especificos e acionaveis.

## Situacao Atual vs. Desejado

| Metrica | Status Atual | Acao Necessaria |
|---------|--------------|-----------------|
| Hook Rate (3s views) | Parcial | Usar `video_3s_views` existente |
| Hold Rate (25% -> 75%) | Nao existe | Buscar `video_p75_watched_actions` da API |
| Close Rate (75% -> 100%) | Nao existe | Buscar `video_p100_watched_actions` da API |
| Connect Rate (Clique -> LP) | Nao existe | Calcular `landing_page_views / link_clicks` |
| CTR (Link) | OK | Ja usa `inline_link_clicks` |
| CPM | OK | Ja calcula corretamente |
| Taxa Conversao LP | OK | Usa vendas / LP views |
| Taxa Checkout | OK | Usa vendas / checkouts iniciados |

---

## Fase 1: Migracao de Banco de Dados

### 1.1 Adicionar Colunas de Video na Tabela ad_spend

```sql
ALTER TABLE public.ad_spend 
ADD COLUMN IF NOT EXISTS video_p25_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_p50_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_p75_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_p100_views integer DEFAULT 0;
```

### 1.2 Adicionar Campo de Nicho ao Projeto

```sql
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS niche varchar(50) DEFAULT 'infoprodutos';
```

---

## Fase 2: Atualizacao das Edge Functions de Sync

### 2.1 Arquivo: supabase/functions/sync-project-data/index.ts

**Mudanca 1: Atualizar campos da API Meta (linha ~530)**

```typescript
// ANTES
const insightsUrl = `...fields=...video_thruplay_watched_actions,video_p25_watched_actions&...`;

// DEPOIS
const insightsUrl = `...fields=...video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions&...`;
```

**Mudanca 2: Extrair novas metricas de video (apos linha ~591)**

```typescript
// Extract video percentage views
const extractVideoViews = (actions: any[]) => {
  if (!actions) return 0;
  const action = actions.find((a: any) => a.action_type === 'video_view');
  return action ? parseInt(action.value || '0') : 0;
};

const videoP25Views = extractVideoViews(insight.video_p25_watched_actions);
const videoP50Views = extractVideoViews(insight.video_p50_watched_actions);
const videoP75Views = extractVideoViews(insight.video_p75_watched_actions);
const videoP100Views = extractVideoViews(insight.video_p100_watched_actions);
```

**Mudanca 3: Adicionar campos no upsert (linha ~595-620)**

```typescript
video_p25_views: videoP25Views,
video_p50_views: videoP50Views,
video_p75_views: videoP75Views,
video_p100_views: videoP100Views,
```

### 2.2 Arquivo: supabase/functions/sync-public-project/index.ts

Aplicar as mesmas mudancas do sync-project-data.

---

## Fase 3: Atualizar Prompt da IA

### 3.1 Arquivo: supabase/functions/generate-daily-report/index.ts

**Mudanca 1: Atualizar calcDayMetrics para incluir novas metricas**

```typescript
const calcDayMetrics = (sales: any[], adSpend: any[], useGross: boolean) => {
  // ... metricas existentes ...
  
  // Novas metricas de video
  const videoP25Views = adSpend.reduce((sum, a) => sum + Number(a.video_p25_views || 0), 0);
  const videoP50Views = adSpend.reduce((sum, a) => sum + Number(a.video_p50_views || 0), 0);
  const videoP75Views = adSpend.reduce((sum, a) => sum + Number(a.video_p75_views || 0), 0);
  const videoP100Views = adSpend.reduce((sum, a) => sum + Number(a.video_p100_views || 0), 0);
  
  // Calcular taxas conforme PRD
  const hookRate = impressions > 0 ? (video3sViews / impressions) * 100 : 0;
  const holdRate = videoP25Views > 0 ? (videoP75Views / videoP25Views) * 100 : 0;
  const closeRate = videoP75Views > 0 ? (videoP100Views / videoP75Views) * 100 : 0;
  const connectRate = linkClicks > 0 ? (lpViews / linkClicks) * 100 : 0;
  const cpmValue = impressions > 0 ? (spend / impressions) * 1000 : 0;
  
  return {
    // ... existentes ...
    videoP25Views, videoP50Views, videoP75Views, videoP100Views,
    hookRate, holdRate, closeRate, connectRate, cpmValue
  };
};
```

**Mudanca 2: Novo prompt completo baseado no PRD**

O prompt sera atualizado para:
- Incluir todas as 8 metricas (Hook, Hold, Close, Connect, CTR, CPM, Taxa Conversao, Taxa Checkout)
- Usar benchmarks do PRD
- Gerar planos de acao especificos conforme problema identificado
- Retornar JSON estruturado

---

## Fase 4: Formulas e Benchmarks Completos

### 4.1 Todas as Metricas

| Metrica | Formula | Critico | Atencao | Bom | Excelente |
|---------|---------|---------|---------|-----|-----------|
| Hook Rate | (Views 3s / Impressoes) x 100 | < 20% | 20-35% | 35-50% | > 50% |
| Hold Rate | (Views 75% / Views 25%) x 100 | < 40% | 40-60% | 60-75% | > 75% |
| Close Rate | (Views 100% / Views 75%) x 100 | < 50% | 50-70% | 70-85% | > 85% |
| Connect Rate | (LP Views / Link Clicks) x 100 | < 60% | 60-75% | 75-90% | > 90% |
| CTR | (Link Clicks / Impressoes) x 100 | < 0.8% | 0.8-1.5% | 1.5-3% | > 3% |
| CPM | (Gasto / Impressoes) x 1000 | > Media+50% | Media | Abaixo Media | Muito Baixo |
| Taxa Conversao LP | (Vendas / LP Views) x 100 | < 1% | 1-3% | 3-7% | > 7% |
| Taxa Checkout | (Vendas / Checkouts) x 100 | < 40% | 40-60% | 60-80% | > 80% |

### 4.2 CPM por Nicho

| Nicho | Baixo | Medio | Alto | Critico |
|-------|-------|-------|------|---------|
| Infoprodutos | R$ 5-15 | R$ 15-30 | R$ 30-50 | > R$ 50 |
| E-commerce | R$ 8-20 | R$ 20-40 | R$ 40-70 | > R$ 70 |
| Servicos B2B | R$ 20-40 | R$ 40-80 | R$ 80-150 | > R$ 150 |
| Saude | R$ 10-25 | R$ 25-50 | R$ 50-90 | > R$ 90 |
| Financas | R$ 15-35 | R$ 35-70 | R$ 70-120 | > R$ 120 |

---

## Fase 5: Planos de Acao por Problema

A IA usara os seguintes planos de acao especificos do PRD:

### 5.1 Hook Baixo (< 20%)
- Otimizar thumbnail com contraste alto
- Reescrever hook verbal com pergunta provocativa
- Testar pattern interrupt visual

### 5.2 Hold Baixo (< 40%)
- Encurtar video em 30-40%
- Adicionar cortes a cada 2-3 segundos
- Criar micro-hooks no meio

### 5.3 Close Baixo (< 50%)
- Fortalecer CTA com verbos de acao
- Criar urgencia e escassez
- Reforcar CTA visualmente

### 5.4 Connect Rate Baixo (< 60%)
- Verificar velocidade da pagina (< 3s)
- Testar links e redirects
- Otimizar para mobile
- Verificar compatibilidade de navegadores

### 5.5 CTR Baixo (< 0.8%)
- Mencionar CTA multiplas vezes no video
- Melhorar oferta com isca digital
- Qualificar melhor o publico

### 5.6 CPM Alto (> Media+50%)
- Expandir publico-alvo
- Melhorar qualidade do criativo
- Ajustar estrategia de lances
- Testar outros posicionamentos

### 5.7 Taxa Conversao Baixa (< 1%)
- Otimizar copy da pagina
- Adicionar elementos de confianca
- Simplificar processo de compra

### 5.8 Taxa Checkout Baixa (< 40%)
- Simplificar checkout
- Transparencia total de custos
- Adicionar mais opcoes de pagamento
- Recuperar carrinhos abandonados

---

## Fase 6: Interface do Dashboard

### 6.1 Novo Card de Engajamento de Video

Em `src/pages/ProjectView.tsx`, adicionar card com:
- Hook Rate, Hold Rate, Close Rate com indicadores de cor
- Connect Rate

### 6.2 Campo de Nicho nas Configuracoes

Em `src/pages/ProjectEdit.tsx`, adicionar select para nicho do projeto.

---

## Cronograma de Implementacao

| Fase | Descricao | Estimativa |
|------|-----------|------------|
| 1 | Migracao de banco (novas colunas) | 5 min |
| 2 | Atualizar sync-project-data e sync-public-project | 15 min |
| 3 | Novo prompt da IA com planos de acao | 25 min |
| 4 | Atualizar dashboard (cards de video) | 15 min |
| 5 | Campo de nicho no projeto | 5 min |

**Total estimado:** ~65 minutos

---

## Pendencias Anteriores

Antes de iniciar esta implementacao, ainda precisamos:

1. **Corrigir kiwify_ticket_price** para R$22,08 no projeto atual
2. **Corrigir gross_amount** de todas as vendas para R$22,08
3. **Simplificar fallback** no sync para usar netAmount quando ticket nao configurado

---

## Resultado Esperado

Apos implementacao:

1. **Dashboard mostrara:**
   - 8 metricas com indicadores de cor (Critico/Atencao/Bom/Excelente)
   - Hook, Hold, Close, Connect Rate
   - CTR, CPM, Taxas de conversao

2. **Relatorio IA tera:**
   - Analise completa de todas as metricas
   - Problemas priorizados por impacto no ROI
   - Planos de acao especificos e acionaveis
   - Metricas de sucesso claras

3. **Beneficio para o usuario:**
   - Saber exatamente ONDE esta o gargalo do funil
   - Receber acoes PRATICAS para resolver cada problema
   - Acompanhar melhoria com metricas claras

