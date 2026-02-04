

# Correção: API Hotmart Retorna Erro "invalid_parameter"

## Problema Identificado

Os logs mostram que **todos os 4 produtos Hotmart** estão retornando erro 400:
```
ERROR [HOTMART] Error fetching product 7101386 (status 400): {"error":"invalid_parameter"}
WARNING [HOTMART] 4/4 products had errors
```

### Causa Raiz

Na linha 374 do `sync-project-data/index.ts`, a URL está usando o parâmetro `page` que **não existe** na API da Hotmart:

```typescript
// ATUAL - INCORRETO
`...&max_results=100&page=${page}`
```

A documentação da Hotmart especifica:
- **page_token** (string): Cursor para paginação, obtido do campo `next_page_token` na resposta anterior
- O parâmetro `page` (numérico) **não existe** e causa erro "invalid_parameter"

---

## Solução

Refatorar a lógica de paginação para usar `page_token` (cursor-based) ao invés de `page` (offset-based).

### Alteração em `supabase/functions/sync-project-data/index.ts`

**De (linhas 367-424):**
```typescript
for (const productId of productIds) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const salesResponse = await fetchWithRetry(
      `https://developers.hotmart.com/payments/api/v1/sales/history?product_id=${productId}&start_date=${startTimestamp}&end_date=${endTimestamp}&max_results=100&page=${page}`,
      ...
    );
    // ...
    hasMore = sales.length >= 100;
    page++;
  }
}
```

**Para:**
```typescript
for (const productId of productIds) {
  let pageToken: string | null = null;
  let hasMore = true;

  while (hasMore) {
    // Build URL with page_token only if we have one (not first page)
    let url = `https://developers.hotmart.com/payments/api/v1/sales/history?product_id=${productId}&start_date=${startTimestamp}&end_date=${endTimestamp}&max_results=100`;
    if (pageToken) {
      url += `&page_token=${encodeURIComponent(pageToken)}`;
    }

    const salesResponse = await fetchWithRetry(url, ...);

    if (salesResponse.ok) {
      const salesData = await salesResponse.json();
      const sales = salesData.items || [];
      
      // Get next page token for cursor-based pagination
      pageToken = salesData.page_info?.next_page_token || null;
      hasMore = !!pageToken;
      
      // ... process sales ...
    }
  }
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/sync-project-data/index.ts` | Linhas 367-424: Refatorar paginação de `page` para `page_token` |

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Erro 400 "invalid_parameter" | Vendas Hotmart sincronizadas corretamente |
| 0 vendas Hotmart no dashboard | Vendas aparecem no projeto "Funil com IA" |

---

## Seção Técnica

### Cursor-based vs Offset-based Pagination

A API da Hotmart usa **cursor-based pagination**:

```text
Offset: ?page=1 → ?page=2 → ?page=3  ❌ Não suportado
Cursor: ?page_token=abc123 → ?page_token=xyz789  ✅ Correto
```

Na primeira requisição, não enviamos `page_token`. A resposta contém:
```json
{
  "items": [...],
  "page_info": {
    "next_page_token": "abc123",
    "prev_page_token": null
  }
}
```

Para a próxima página, usamos o `next_page_token` retornado. Quando ele for `null` ou não existir, acabaram as páginas.

