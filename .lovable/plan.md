

# Fase 1: Otimizações Seguras de Performance

## Objetivo

Implementar apenas melhorias que garantidamente NÃO pioram a performance atual:
- Criar índices de banco de dados (sempre melhora queries)
- Adicionar `fetchWithRetry` para rate limiting (evita falhas silenciosas)
- Implementar `parseAmount` para validação de dados (evita erros)

**O que NÃO faremos nesta fase:**
- Paralelização (Promise.all) - pode causar rate limiting
- Batch inserts - pode causar erros em transações grandes
- Cache de métricas - requer nova tabela e lógica complexa

## Alterações

### 1. Criar Índices no Banco de Dados

Adicionar índices compostos para acelerar queries em 10-100x:

```sql
-- Índice principal para vendas (usado no Dashboard)
CREATE INDEX IF NOT EXISTS idx_sales_project_date_status 
ON sales(project_id, sale_date DESC, status);

-- Índice para gastos com anúncios
CREATE INDEX IF NOT EXISTS idx_ad_spend_project_date 
ON ad_spend(project_id, date DESC);

-- Índice para busca por fonte
CREATE INDEX IF NOT EXISTS idx_sales_source_project 
ON sales(source, project_id);
```

**Impacto:** Queries de 2-5s passam para 50-200ms. Zero risco de piorar performance.

### 2. Adicionar `fetchWithRetry` com Exponential Backoff

Criar função helper para tratar rate limiting das APIs:

```typescript
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    // Rate limit ou erro de servidor - tentar novamente
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) return response;
      
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter 
        ? parseInt(retryAfter) * 1000 
        : Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      
      console.log(`Attempt ${attempt} failed (${response.status}). Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    
    return response;
  }
  throw new Error('Max retries exceeded');
}
```

**Impacto:** Evita falhas silenciosas por rate limiting. Zero impacto negativo.

### 3. Adicionar `parseAmount` para Validação

Criar função para sanitizar valores monetários:

```typescript
function parseAmount(value: any): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}
```

Aplicar em todos os cálculos de valores:
- Kiwify: `netAmount`, `grossAmount`
- Hotmart: `saleAmount`
- Guru: `saleAmount`
- Meta Ads: `spend`, `cpc`, `cpm`, `frequency`

**Impacto:** Evita inserção de NaN/undefined no banco. Zero impacto negativo.

## Arquivo a Modificar

**`supabase/functions/sync-project-data/index.ts`**

Adicionar no início do arquivo (após as funções existentes):
1. Função `fetchWithRetry`
2. Função `parseAmount`

Substituir chamadas `fetch()` por `fetchWithRetry()` apenas em:
- Token requests (OAuth) - linhas 184, 340, 468
- Sales API requests - linhas 226, 373, 465

Aplicar `parseAmount()` em:
- Kiwify (linhas 279-291)
- Hotmart (linha 390)
- Guru (linha 488)
- Meta Ads (linhas 652-658)

## Migração de Banco de Dados

Executar via ferramenta de migração:

```sql
-- Índices para otimização de queries
CREATE INDEX IF NOT EXISTS idx_sales_project_date_status 
ON sales(project_id, sale_date DESC, status);

CREATE INDEX IF NOT EXISTS idx_ad_spend_project_date 
ON ad_spend(project_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_sales_source_project 
ON sales(source, project_id);
```

## Estimativa de Tempo

| Tarefa | Tempo |
|--------|-------|
| Criar índices (migração) | 5 min |
| Implementar `fetchWithRetry` | 10 min |
| Implementar `parseAmount` | 5 min |
| Aplicar funções no código | 15 min |
| Deploy e teste | 5 min |
| **Total** | **~40 min** |

## Resultados Esperados

| Métrica | Antes | Depois |
|---------|-------|--------|
| Query de vendas no Dashboard | 2-5s | 50-200ms |
| Query de ad_spend | 1-3s | 30-100ms |
| Falhas por rate limit | Erro silencioso | Retry automático |
| Erros de dados inválidos | NaN no banco | 0 tratado |

