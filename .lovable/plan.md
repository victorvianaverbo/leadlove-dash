
# Plano: Corrigir Cálculo de Receita na Edge Function generate-daily-report

## Problema Identificado

A edge function `generate-daily-report` não usa a lógica de prioridade do ticket price que foi implementada no frontend.

**Código atual (linha 233-236):**
```typescript
const revenue = sales.reduce((sum, s) => {
  const value = useGrossForRevenue ? (Number(s.gross_amount) || Number(s.amount)) : Number(s.amount);
  return sum + value;
}, 0);
```

Este código **ignora** o `kiwify_ticket_price` configurado no projeto da Adri (R$27), resultando em receita incorreta de R$22,08 ao invés de R$27.

---

## Solução

Alterar a função `calcDayMetrics` para seguir a mesma lógica de prioridade implementada nos dashboards:

1. Se tem `ticketPrice` configurado → `vendas × ticketPrice`
2. Se não tem ticket mas `useGrossForRevenue` → soma `gross_amount`
3. Senão → soma `amount` (líquido individual)

---

## Mudanças Técnicas

**Arquivo:** `supabase/functions/generate-daily-report/index.ts`

### 1. Ler o ticket price do projeto (após linha 215)

```typescript
const useGrossForRevenue = projectData.use_gross_for_roas || false;
const ticketPrice = projectData.kiwify_ticket_price || null;  // NOVO
```

### 2. Alterar cálculo de receita na função calcDayMetrics (linhas 233-236)

```typescript
// ANTES
const revenue = sales.reduce((sum, s) => {
  const value = useGrossForRevenue ? (Number(s.gross_amount) || Number(s.amount)) : Number(s.amount);
  return sum + value;
}, 0);

// DEPOIS: Ticket price tem prioridade
const revenue = ticketPrice 
  ? sales.length * ticketPrice
  : sales.reduce((sum, s) => {
      const value = useGrossForRevenue ? (Number(s.gross_amount) || Number(s.amount)) : Number(s.amount);
      return sum + value;
    }, 0);
```

---

## Resultado Esperado

Após a correção, o relatório da IA para a Adri vai calcular:

| Dia | Vendas | Cálculo | Receita |
|-----|--------|---------|---------|
| Ontem | 1 | 1 × R$27 | **R$27,00** |

Isso resolve a inconsistência entre os dashboards (frontend) e os relatórios da IA (edge function), garantindo que todos usem a mesma lógica de prioridade do ticket price.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-daily-report/index.ts` | Adicionar leitura de `kiwify_ticket_price` e alterar cálculo de receita |
