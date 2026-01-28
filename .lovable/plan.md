
# Correção do Erro 409 Conflict na Tabela metrics_cache

## Diagnóstico

O erro **"409 Conflict"** e **"signal is aborted without reason"** ocorrem devido a uma **race condition** no hook `useMetricsCache`:

```text
FLUXO PROBLEMÁTICO:
Requisição A: Verifica se existe → Não existe
Requisição B: Verifica se existe → Não existe  
Requisição A: Tenta inserir → SUCESSO
Requisição B: Tenta inserir → 409 CONFLICT (registro já existe)
```

A tabela `metrics_cache` tem uma restrição `UNIQUE (project_id, cache_date, date_range)`, e o código atual faz "check then insert" que não é atômico.

---

## Solução

### Modificar `src/hooks/useMetricsCache.ts`

Substituir a lógica de "verificar e inserir" por um **UPSERT atômico** usando o método `.upsert()` do Supabase:

**Antes (linhas 80-112):**
```typescript
// Check if cache entry exists
const { data: existing } = await supabase
  .from('metrics_cache')
  .select('id')
  .eq('project_id', projectId)
  .eq('cache_date', today)
  .eq('date_range', dateRange)
  .maybeSingle();

if (existing) {
  // Update existing
  const { error } = await supabase
    .from('metrics_cache')
    .update({ metrics: metricsJson, updated_at: new Date().toISOString() })
    .eq('id', existing.id);
  if (error) throw error;
} else {
  // Insert new
  const { error } = await supabase
    .from('metrics_cache')
    .insert([insertData]);
  if (error) throw error;
}
```

**Depois:**
```typescript
// Use upsert to atomically insert or update
const { error } = await supabase
  .from('metrics_cache')
  .upsert({
    project_id: projectId,
    cache_date: today,
    date_range: dateRange,
    metrics: metricsJson,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'project_id,cache_date,date_range'
  });

if (error) throw error;
```

O método `.upsert()` com `onConflict` é atômico e evita race conditions completamente.

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useMetricsCache.ts` | Substituir lógica check-then-insert por upsert atômico |

---

## Resultado Esperado

Após a correção:
- Não haverá mais erros 409 Conflict na tabela `metrics_cache`
- O erro "signal is aborted without reason" desaparecerá
- A sincronização de métricas funcionará de forma estável
