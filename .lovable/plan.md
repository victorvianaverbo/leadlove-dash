

# Correção Definitiva do Erro 409 Conflict no metrics_cache

## Diagnóstico

Após análise detalhada, identifiquei **duas causas** para o erro 409 persistir:

### Causa 1: useEffect dispara múltiplas requisições
O `useEffect` em `ProjectView.tsx` chama `updateCache(calculatedMetrics)` sem verificar se o cache já existe. Como o `calculatedMetrics` é recalculado frequentemente, isso gera requisições simultâneas:

```text
Render 1 → updateCache() → POST
Render 2 → updateCache() → POST  (antes do 1 terminar)
Render 3 → updateCache() → POST  (antes do 2 terminar)
```

### Causa 2: Falta de deduplicação na mutation
O React Query `useMutation` não previne chamadas duplicadas por padrão, permitindo que múltiplas requisições sejam enviadas ao mesmo tempo.

---

## Solução

### 1. Adicionar verificação de cache válido antes de atualizar

Modificar `ProjectView.tsx` para só chamar `updateCache` quando o cache estiver inválido ou expirado:

```typescript
// Use metrics cache hook
const { updateCache, isCacheValid } = useMetricsCache(id, dateRange);

// Update cache when metrics change AND cache is invalid
useEffect(() => {
  if (id && totalRevenue !== undefined && !salesLoading && !adSpendLoading && !isCacheValid) {
    updateCache(calculatedMetrics);
  }
}, [id, calculatedMetrics, salesLoading, adSpendLoading, isCacheValid]);
```

### 2. Adicionar debounce no hook useMetricsCache

Para evitar chamadas simultâneas, implementar um debounce de 500ms:

```typescript
import { useRef, useCallback } from 'react';

// Inside the hook:
const debounceTimer = useRef<NodeJS.Timeout | null>(null);

const debouncedMutate = useCallback((metrics: CachedMetrics) => {
  if (debounceTimer.current) {
    clearTimeout(debounceTimer.current);
  }
  debounceTimer.current = setTimeout(() => {
    updateCacheMutation.mutate(metrics);
  }, 500);
}, [updateCacheMutation.mutate]);
```

### 3. Adicionar tratamento de erro 409 como sucesso

Se um 409 ocorrer (registro já existe), isso significa que outra requisição foi bem-sucedida - devemos tratar como sucesso:

```typescript
const { error } = await supabase
  .from('metrics_cache')
  .upsert({...}, { onConflict: 'project_id,cache_date,date_range' });

// Treat 409 as success (another request succeeded)
if (error && error.code !== '23505' && !error.message.includes('duplicate')) {
  throw error;
}
```

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/hooks/useMetricsCache.ts` | Adicionar debounce e tratamento de erro 409 |
| `src/pages/ProjectView.tsx` | Condicionar updateCache a `!isCacheValid` |

---

## Resultado Esperado

- O cache só será atualizado quando necessário (expirado ou inexistente)
- Chamadas duplicadas serão agrupadas pelo debounce
- Erros 409 serão ignorados silenciosamente (outra requisição teve sucesso)
- Não haverá mais mensagens de erro no console

