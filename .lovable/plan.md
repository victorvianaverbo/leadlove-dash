

# Correção: Faturamento Hotmart Dividido por 100 Incorretamente

## Problema Identificado

As vendas Hotmart estão com valores incorretos no banco:
```
amount: 0.27  → Deveria ser R$ 27,00
amount: 0.37  → Deveria ser R$ 37,00  
amount: 0.01  → Deveria ser R$ 1,00
```

### Causa Raiz

Na linha 420 do `sync-project-data/index.ts`:
```typescript
const saleAmount = parseAmount(sale.purchase?.price?.value || sale.price || 0) / 100;
```

O código divide por 100, assumindo que o valor vem em centavos (como a Kiwify). Porém, a **API Hotmart retorna valores em reais** (decimal), não em centavos.

**Documentação Hotmart confirma:**
```json
"price": {
  "value": 235.76,  // ← Já em reais, não centavos
  "currency_code": "USD"
}
```

---

## Solução

Remover a divisão por 100 **apenas** para o mapeamento Hotmart.

### Alteração em `supabase/functions/sync-project-data/index.ts`

**De (linha 420):**
```typescript
const saleAmount = parseAmount(sale.purchase?.price?.value || sale.price || 0) / 100;
```

**Para:**
```typescript
// Hotmart returns price in decimal format (e.g., 235.76), NOT in cents like Kiwify
const saleAmount = parseAmount(sale.purchase?.price?.value || sale.price || 0);
```

---

## Correção dos Dados Existentes

Após deploy, será necessário **re-sincronizar** o projeto para atualizar os valores das vendas já inseridas (o upsert sobrescreverá com os valores corretos).

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/sync-project-data/index.ts` | Linha 420: Remover `/ 100` do cálculo Hotmart |

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| R$ 0,27 | **R$ 27,00** |
| R$ 0,37 | **R$ 37,00** |
| R$ 0,01 | **R$ 1,00** |
| Faturamento total ~R$ 0,65 | **Faturamento correto** |

---

## Seção Técnica

### Por que Kiwify divide por 100 e Hotmart não?

| Plataforma | Formato do Valor | Tratamento |
|------------|------------------|------------|
| **Kiwify** | Centavos (2700 = R$ 27,00) | `/ 100` ✅ |
| **Hotmart** | Decimal (27.00 = R$ 27,00) | Sem divisão ✅ |
| **Guru** | Decimal | Sem divisão (já implementado) |

