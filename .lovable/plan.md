

# Plano: Correção do Cálculo de Faturamento com Ticket Price

## Problema Identificado

O faturamento está calculando **R$1.376,64** quando deveria ser **R$1.539,00** (57 vendas × R$27).

**Causa raiz**: Quando você alterou o preço do ticket de R$22,08 para R$27:
- 33 vendas antigas mantiveram `gross_amount = R$22,08`
- 24 vendas novas estão com `gross_amount = R$27,00`
- O dashboard soma os valores individuais em vez de usar o ticket configurado

## Solução Proposta

Modificar a lógica do dashboard para:
- **Quando o ticket price estiver configurado**: calcular faturamento como `quantidade de vendas × ticket_price`
- **Quando NÃO estiver configurado**: manter o comportamento atual (soma de gross_amount ou amount)

### Mudanças Necessárias

**Arquivo: `src/pages/ProjectView.tsx`**

```typescript
// ANTES (linha ~376-379)
const totalRevenue = filteredSales?.reduce((sum, s) => {
  const valueToUse = useGrossForRoas ? ((s as any).gross_amount || s.amount) : s.amount;
  return sum + Number(valueToUse);
}, 0) || 0;

// DEPOIS
const ticketPrice = (project as any)?.kiwify_ticket_price 
  ? parseFloat((project as any).kiwify_ticket_price) 
  : null;

const totalRevenue = (() => {
  if (ticketPrice && useGrossForRoas) {
    // Usar ticket fixo: quantidade × preço
    return (filteredSales?.length || 0) * ticketPrice;
  }
  // Fallback: somar valores individuais
  return filteredSales?.reduce((sum, s) => {
    const valueToUse = useGrossForRoas ? ((s as any).gross_amount || s.amount) : s.amount;
    return sum + Number(valueToUse);
  }, 0) || 0;
})();
```

**Também atualizar cálculo por UTM (linha ~422-424)**:

```typescript
// Usar ticket fixo quando configurado
const saleValue = (ticketPrice && useGrossForRoas) 
  ? ticketPrice 
  : (useGrossForRoas ? ((sale as any).gross_amount || sale.amount) : sale.amount);
acc[key].revenue += Number(saleValue);
```

**Arquivo: `src/pages/PublicDashboard.tsx`**

Aplicar a mesma lógica para o dashboard público.

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| 57 vendas × R$27 | R$1.376,64 | R$1.539,00 |
| Mudança de ticket | Valores antigos permanecem | Recalcula automaticamente |

## Benefícios

1. **Consistência**: Sempre usa o valor configurado no ticket
2. **Flexibilidade**: Mudar o ticket reflete imediatamente no dashboard
3. **Simplicidade**: Não precisa atualizar vendas antigas manualmente

## Tempo Estimado

~10 minutos para implementar em ambos os dashboards.

