

# Corrigir Sincronização Guru - Valores e Datas

## Diagnóstico

A sincronização do Guru apresenta **dois problemas**:

### 1. Erro de Data
```
date/time field value out of range: "1770246407"
```
O campo `confirmed_at` vem como **timestamp Unix em segundos**, mas está sendo passado diretamente ao banco sem conversão para ISO.

### 2. Valores Zerados
O código busca campos que não existem na estrutura da API v2:
```typescript
// Código atual - campos incorretos
sale.amount || sale.value || sale.price  // NÃO existem na raiz
```

A API retorna valores dentro de objetos aninhados:
- `payment.amount` / `payment.total_value`
- `items[].price` / `items[].value`
- `invoice.total` / `invoice.value`

---

## Evidências (Medsimple)

| Métrica | Valor |
|---------|-------|
| Vendas importadas | 118 |
| Valor total | R$ 0,00 |
| Erros de insert | 82 (todas Guru + Hotmart) |
| Causa | Timestamp não convertido |

---

## Solução

### Mudanças no sync-project-data/index.ts

**1. Usar `convertTimestampToISO()` para datas do Guru** (linha 566)

```typescript
// ANTES
const saleDate = sale.dates?.confirmed_at || sale.confirmed_at || ...;

// DEPOIS
const saleDate = convertTimestampToISO(
  sale.dates?.confirmed_at || sale.confirmed_at || 
  sale.dates?.created_at || sale.created_at
);
```

**2. Expandir busca de valores com campos adicionais**

```typescript
// Buscar em payment (campos comuns da API Guru)
const paymentAmount = sale.payment?.amount || sale.payment?.total_value || 
                      sale.payment?.value || sale.payment?.total || 0;

// Buscar em invoice  
const invoiceTotal = sale.invoice?.total || sale.invoice?.value || 
                     sale.invoice?.total_value || 0;

// Buscar em items (somando todos)
const itemsTotal = Array.isArray(sale.items) 
  ? sale.items.reduce((sum, item) => 
      sum + parseAmount(item.price || item.value || item.total || 0), 0)
  : 0;

// Buscar em contracts (alternativa para assinaturas)
const contractAmount = sale.contracts?.[0]?.value || 0;

// Prioridade de seleção
const saleAmount = parseAmount(
  paymentAmount || invoiceTotal || itemsTotal || contractAmount || 0
);
```

**3. Adicionar logs de debug robustos**

```typescript
if (sales.length > 0 && page === 1) {
  const sample = sales[0];
  console.log(`[GURU] Sample sale keys:`, Object.keys(sample));
  console.log(`[GURU] Sample payment:`, JSON.stringify(sample.payment || null));
  console.log(`[GURU] Sample items:`, JSON.stringify(sample.items || null));
  console.log(`[GURU] Sample invoice:`, JSON.stringify(sample.invoice || null));
  console.log(`[GURU] Sample contracts:`, JSON.stringify(sample.contracts || null));
  console.log(`[GURU] Sample dates:`, JSON.stringify(sample.dates || null));
}
```

---

## Fluxo de Dados Corrigido

```text
API Guru v2 Response
       │
       ▼
┌──────────────────────────────────┐
│ Extração de Valor                │
│ payment.amount                   │
│ ├─ payment.total_value           │
│ ├─ invoice.total                 │
│ ├─ items[].price (soma)          │
│ └─ contracts[0].value            │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Extração de Data                 │
│ convertTimestampToISO()          │
│ ├─ dates.confirmed_at            │
│ ├─ confirmed_at                  │
│ └─ dates.created_at              │
└──────────────────────────────────┘
       │
       ▼
   Database INSERT
```

---

## Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/sync-project-data/index.ts` | Atualizar lógica de extração do Guru (linhas 545-590) |

---

## Pós-Implementação

1. Deploy automático da edge function
2. Re-sincronizar projeto Medsimple
3. Verificar logs para confirmar estrutura real
4. Validar se valores e datas estão corretos

