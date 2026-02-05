

# Corrigir Faturamento Guru - Projeto MEMORIMED

## Diagnóstico

O faturamento do Guru está aparecendo como **R$ 0,00** porque o código de sincronização não está extraindo o valor monetário corretamente da API v2.

### Evidências

| Dado | Valor |
|------|-------|
| Vendas importadas | 6 registros |
| Amount | 0.00 (todas) |
| Gross Amount | 0 (todas) |

### Estrutura Real da API (logs)

```json
["affiliations","checkout_url","contact","contracts","dates","ecommerces",
"extras","has_order_bump","id","infrastructure","invoice","is_order_bump",
"is_reissue","items","last_transaction","payment","product","shipment",
"shipping","status","subscription","trackings","type","self_attribution"]
```

O código atual busca:
```typescript
sale.amount || sale.value || sale.price  // INCORRETO - esses campos não existem
```

---

## Solução

Atualizar a extração de valor na função `syncGuru` para buscar nos campos corretos:

| Campo API | Caminho Provável |
|-----------|------------------|
| Valor do pagamento | `payment.amount` ou `payment.value` |
| Valor dos itens | `items[0].price` ou soma de `items[].price` |
| Valor bruto | `invoice.total` ou `payment.gross_amount` |

---

## Alterações

### supabase/functions/sync-project-data/index.ts

**Linhas 548-560** - Atualizar extração de valores:

```typescript
for (const sale of sales) {
  const saleId = `guru_${sale.id || sale.transaction_id || Date.now()}`;
  
  // Buscar valor nos campos corretos da API v2
  const paymentAmount = sale.payment?.amount || sale.payment?.value || 0;
  const itemsTotal = Array.isArray(sale.items) 
    ? sale.items.reduce((sum: number, item: any) => sum + parseAmount(item.price || item.value || item.amount || 0), 0)
    : 0;
  const invoiceTotal = sale.invoice?.total || sale.invoice?.amount || 0;
  
  // Prioridade: payment > items > invoice > 0
  const saleAmount = parseAmount(paymentAmount || itemsTotal || invoiceTotal || sale.amount || sale.value || sale.price || 0);
  
  const saleDate = sale.dates?.confirmed_at || sale.confirmed_at || sale.dates?.created_at || sale.created_at || new Date().toISOString();
  
  productSales.push({
    // ... resto do código
    amount: saleAmount,
    gross_amount: saleAmount,
    // ...
  });
}
```

Também adicionar log de debug para capturar a estrutura exata:

```typescript
if (sales.length > 0 && page === 1) {
  console.log(`[GURU] Sample sale structure:`, JSON.stringify(Object.keys(sales[0])));
  console.log(`[GURU] Sample payment:`, JSON.stringify(sales[0].payment));
  console.log(`[GURU] Sample items:`, JSON.stringify(sales[0].items));
  console.log(`[GURU] Sample invoice:`, JSON.stringify(sales[0].invoice));
}
```

---

## Arquivos

| Arquivo | Tipo |
|---------|------|
| `supabase/functions/sync-project-data/index.ts` | Editar |

---

## Pós-Implementação

1. Deploy da edge function
2. Re-sincronizar o projeto MEMORIMED
3. Verificar se os valores aparecem corretamente

