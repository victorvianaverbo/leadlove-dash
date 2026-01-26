
# Plano: Corrigir Cálculo de Receita nos Cards do Dashboard

## Problema Identificado

O código em `Dashboard.tsx` (linhas 128-146) calcula a receita **sem considerar o ticket price**:

```typescript
// CÓDIGO ATUAL - NÃO USA TICKET PRICE
const projectSettings = new Map(projects.map(p => [p.id, (p as any).use_gross_for_roas || false]));

salesResult.data?.forEach((sale: any) => {
  const useGross = projectSettings.get(sale.project_id);
  const valueToUse = useGross ? (sale.gross_amount || sale.amount) : sale.amount;
  metrics[sale.project_id].revenue += Number(valueToUse) || 0;
});
```

**Resultado atual no card da Adri:**
- Receita: R$22,08 (soma dos valores individuais)
- ROAS: 0.04x (negativo)

**Resultado esperado:**
- Receita: R$1.539,00 (57 vendas × R$27)
- ROAS: 2.50x (positivo)

---

## Solução

Alterar a lógica de cálculo de métricas para seguir a prioridade:

1. **Se tem `kiwify_ticket_price`** → contagem de vendas × ticket price
2. **Se tem `use_gross_for_roas`** → soma de `gross_amount`
3. **Senão** → soma de `amount`

---

## Mudanças Técnicas

**Arquivo:** `src/pages/Dashboard.tsx`

### 1. Expandir o mapa de configurações do projeto (linha 136)

```typescript
// ANTES
const projectSettings = new Map(projects.map(p => [p.id, (p as any).use_gross_for_roas || false]));

// DEPOIS
const projectSettings = new Map(projects.map(p => [
  p.id, 
  {
    useGross: (p as any).use_gross_for_roas || false,
    ticketPrice: (p as any).kiwify_ticket_price || null
  }
]));
```

### 2. Alterar o cálculo de receita (linhas 138-146)

```typescript
// ANTES
salesResult.data?.forEach((sale: any) => {
  if (!metrics[sale.project_id]) {
    metrics[sale.project_id] = { revenue: 0, spend: 0 };
  }
  const useGross = projectSettings.get(sale.project_id);
  const valueToUse = useGross ? (sale.gross_amount || sale.amount) : sale.amount;
  metrics[sale.project_id].revenue += Number(valueToUse) || 0;
});

// DEPOIS: Ticket price tem prioridade
// Primeiro, contar vendas por projeto (para projetos com ticket price)
const salesCountByProject: Record<string, number> = {};
salesResult.data?.forEach((sale: any) => {
  salesCountByProject[sale.project_id] = (salesCountByProject[sale.project_id] || 0) + 1;
});

// Agora calcular receita com a lógica de prioridade
salesResult.data?.forEach((sale: any) => {
  if (!metrics[sale.project_id]) {
    metrics[sale.project_id] = { revenue: 0, spend: 0 };
  }
  
  const settings = projectSettings.get(sale.project_id);
  const ticketPrice = settings?.ticketPrice;
  
  // Se tem ticket price, calcular apenas uma vez por projeto
  if (ticketPrice && metrics[sale.project_id].revenue === 0) {
    const salesCount = salesCountByProject[sale.project_id] || 0;
    metrics[sale.project_id].revenue = salesCount * ticketPrice;
  } else if (!ticketPrice) {
    // Sem ticket price: usar gross ou amount
    const useGross = settings?.useGross;
    const valueToUse = useGross ? (sale.gross_amount || sale.amount) : sale.amount;
    metrics[sale.project_id].revenue += Number(valueToUse) || 0;
  }
});
```

---

## Resultado Esperado

| Projeto | Ticket Price | Vendas | Cálculo | Receita |
|---------|--------------|--------|---------|---------|
| Adri | R$27 | 57 | 57 × 27 | **R$1.539,00** |
| Sexólogo | R$27 | ~51 | 51 × 27 | **~R$1.377,00** |

Com a receita correta, o ROAS também será calculado corretamente:
- Adri: R$1.539 / R$614 = **2.50x** (positivo!)
- Sexólogo: R$1.377 / R$1.457 = **0.94x**

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Dashboard.tsx` | Alterar lógica de cálculo de métricas (linhas 136-146) para priorizar ticket price |
