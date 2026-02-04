

# Otimização da Primeira Sincronização de Projetos

## Problema Identificado

A primeira sincronização de um projeto novo demora muito porque:

1. **90 dias de dados** - A primeira sincronização busca 90 dias de histórico (`FIRST_SYNC_DAYS = 90`)
2. **Muitos produtos/campanhas** - Projetos podem ter dezenas de produtos e campanhas (ex: Medsimple tem 36 Hotmart + 18 Guru + 95 Meta campaigns)
3. **Paginação sequencial** - Cada produto é processado página por página dentro de cada API
4. **Timeout do Edge Function** - Supabase Edge Functions têm limite de 60 segundos, causando erro quando há muito volume
5. **Feedback pobre** - O usuário não vê progresso, apenas espera

## Soluções Propostas

### 1. Sincronização em Fases (Chunked Sync)

Dividir a primeira sincronização em chamadas menores que não ultrapassem o timeout:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 1: Sincronizar primeiro (requisição inicial)                 │
│  - Processar todos os produtos/campanhas                            │
│  - Limitar a 30 dias em vez de 90 na primeira sync                 │
│  - Retornar status parcial para o frontend                         │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 2: Background sync para dados históricos                     │
│  - Usar waitUntil para continuar após resposta                     │
│  - Processar os 60 dias restantes em background                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Feedback de Progresso no Frontend

Adicionar indicadores visuais durante a sincronização:

- Spinner com mensagem "Sincronizando vendas..."
- Mostrar etapas: "Conectando APIs" → "Importando vendas" → "Processando métricas"
- Toast de sucesso com contagem de registros importados

### 3. Reduzir Janela de Primeira Sincronização

Alterar de 90 dias para 30 dias na primeira sincronização:
- Dados recentes são mais relevantes
- Reduz tempo de 90+ segundos para ~30 segundos
- Sincronizações incrementais mantêm dados atualizados

### 4. Paralelizar Produtos Dentro de Cada Plataforma

Atualmente os produtos são processados sequencialmente. Paralelizar em chunks:

```typescript
// Antes: sequencial
for (const productId of productIds) {
  await fetchProduct(productId);
}

// Depois: paralelo em chunks de 3
const chunks = chunkArray(productIds, 3);
for (const chunk of chunks) {
  await Promise.all(chunk.map(id => fetchProduct(id)));
}
```

---

## Alterações Técnicas

### 1. Edge Function: sync-project-data/index.ts

| Alteração | Descrição |
|-----------|-----------|
| Reduzir `FIRST_SYNC_DAYS` | De 90 para 30 dias |
| Paralelizar produtos | Processar 3-5 produtos simultaneamente por plataforma |
| Usar `waitUntil` | Continuar processamento em background após resposta |
| Retornar timing detalhado | Informar tempo de cada etapa para diagnóstico |

### 2. Frontend: ProjectView.tsx

| Alteração | Descrição |
|-----------|-----------|
| Estado de progresso | Mostrar etapas durante sincronização |
| Mensagem melhorada | Toast com contagem de registros importados |
| Tratamento de timeout | Retry automático ou mensagem explicativa |

### 3. Nova Feature: Sincronização Resumível

Para projetos muito grandes, implementar cursor de sincronização:

| Coluna | Tabela | Descrição |
|--------|--------|-----------|
| `sync_cursor` | projects | JSON com estado da última sync parcial |
| `sync_status` | projects | 'idle', 'running', 'completed', 'failed' |

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Tempo primeira sync (projeto pequeno) | 30-60s | 10-15s |
| Tempo primeira sync (projeto grande) | 90s+ (timeout) | 30s + background |
| Feedback visual | Nenhum | Progresso em etapas |
| Risco de timeout | Alto | Baixo |
| Dados importados | 90 dias | 30 dias inicial + histórico em background |

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/sync-project-data/index.ts` | Otimizações de paralelização, redução de janela, waitUntil |
| `src/pages/ProjectView.tsx` | UI de progresso, mensagens melhoradas |

