

# Plano de Correção: Valor do Ticket Kiwify

## Diagnóstico do Problema

**Encontrado:** O campo `kiwify_ticket_price` está com valor **R$27,00** ao invés de **R$22,08**.

| Métrica | Valor |
|---------|-------|
| Total de vendas pagas | 57 |
| Vendas com R$22,08 | 33 |
| Vendas com R$27,00 | 24 |
| Faturamento atual | R$1.376,64 (33×22,08 + 24×27) |
| Faturamento correto | R$1.258,56 (57×22,08) |

## Mudanças Necessárias

### 1. Corrigir dados no banco

**Atualizar projeto:**
```sql
UPDATE projects SET kiwify_ticket_price = 22.08 WHERE id = '17e6cbd5-a59a-41ec-91af-eb5e9e351789'
```

**Corrigir todas as vendas:**
```sql
UPDATE sales SET gross_amount = 22.08 WHERE project_id = '17e6cbd5-a59a-41ec-91af-eb5e9e351789' AND status = 'paid'
```

### 2. Ajustar lógica de sync (como você pediu)

Se o campo de ticket **não estiver preenchido**, usar o **valor líquido** (`amount`) de cada venda ao invés de tentar calcular:

**Arquivo:** `supabase/functions/sync-project-data/index.ts`  
**Arquivo:** `supabase/functions/sync-public-project/index.ts`

```typescript
// ANTES (problemático)
if (ticketPrice !== null) {
  grossAmount = ticketPrice;
} else {
  grossAmount = chargeAmount > 0 
    ? (chargeAmount - platformFee) / 100 
    : netAmount;
}

// DEPOIS (simplificado)
// Se tem preço de ticket configurado, usa ele
// Senão, usa o valor líquido (netAmount)
const grossAmount = ticketPrice !== null ? ticketPrice : netAmount;
```

### 3. Cálculo de receita no dashboard

O código em `ProjectView.tsx` linha 376-378 já usa corretamente:
```typescript
const valueToUse = useGrossForRoas ? gross_amount : amount;
```

Com `use_gross_for_roas = true`, ele usa `gross_amount` que será o valor do ticket quando configurado.

## Resumo

| Ação | Arquivo |
|------|---------|
| Corrigir kiwify_ticket_price para 22.08 | Banco de dados |
| Atualizar gross_amount de todas vendas | Banco de dados |
| Simplificar fallback (usar netAmount) | sync-project-data + sync-public-project |

## Resultado Esperado

Faturamento correto: **R$1.258,56** (57 vendas × R$22,08)

