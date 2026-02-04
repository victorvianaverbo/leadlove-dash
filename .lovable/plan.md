

# Correção: Conversão de Timestamp Hotmart para Data ISO

## Problema Identificado

Os logs revelam o erro real:

```
ERROR Batch upsert error (batch 1): {
  code: "22008",
  message: 'date/time field value out of range: "1770154401000"'
}
INFO Sales batch complete: 0 success, 3 errors
```

A API Hotmart retorna `approved_date` como **timestamp em milissegundos** (ex: `1770154401000`), mas o código passa esse valor numérico diretamente para o banco, que espera uma string ISO ou timestamp em segundos.

---

## Solução

Converter o timestamp de milissegundos para ISO string antes de inserir no banco.

### Alteração em `supabase/functions/sync-project-data/index.ts`

**De (linha 413):**
```typescript
sale_date: sale.purchase?.approved_date || sale.approved_date || sale.order_date,
```

**Para:**
```typescript
sale_date: convertTimestampToISO(sale.purchase?.approved_date || sale.approved_date || sale.order_date),
```

**Nova função helper (adicionar após linha ~167):**
```typescript
// Convert timestamp (ms or seconds) to ISO string
function convertTimestampToISO(value: any): string {
  if (!value) return new Date().toISOString();
  
  // If already a string in ISO format, return as-is
  if (typeof value === 'string' && value.includes('-')) {
    return value;
  }
  
  // If numeric timestamp
  const numValue = Number(value);
  if (!isNaN(numValue)) {
    // Hotmart uses milliseconds - values > year 2100 in seconds = definitely ms
    const isMilliseconds = numValue > 4102444800000 / 1000; // ~2100 in seconds
    const timestamp = isMilliseconds ? numValue : numValue * 1000;
    return new Date(timestamp).toISOString();
  }
  
  return new Date().toISOString();
}
```

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/sync-project-data/index.ts` | Linha ~167: Adicionar função `convertTimestampToISO()` |
| `supabase/functions/sync-project-data/index.ts` | Linha 413: Usar função para converter timestamp |

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| `sale_date: 1770154401000` ❌ | `sale_date: "2026-02-04T13:13:21.000Z"` ✅ |
| Erro 22008: "date/time field value out of range" | 3 vendas Hotmart inseridas com sucesso |

---

## Seção Técnica

### Detecção de Milissegundos vs Segundos

A função usa uma heurística simples: se o valor numérico representa uma data depois do ano 2100 quando interpretado como segundos, então é certamente milissegundos:

```text
1770154401000 (ms) → 2026-02-04 ✅
1770154401000 (s)  → ~58,073 AD ❌ (impossível)
```

Isso garante compatibilidade caso a Hotmart mude o formato no futuro.

