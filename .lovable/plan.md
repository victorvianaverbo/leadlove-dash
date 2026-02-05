
# Corrigir Labels Dinâmicos de Fonte de Vendas

## Problema

No `ProjectView.tsx`, os cards de KPIs do funil mostram "Kiwify" fixo como fonte das vendas, mesmo quando o projeto usa Guru ou Hotmart.

| Atual | Esperado |
|-------|----------|
| `subtitle="Kiwify"` | `subtitle="Guru"` (quando só tem Guru) |
| `subtitle="Meta ÷ Kiwify"` | `subtitle="Meta ÷ Multi-checkout"` (quando tem mais de uma fonte) |

## Cards Afetados

| Card | Linha | Subtitle Atual |
|------|-------|----------------|
| Vendas | 946 | "Kiwify" |
| Custo/Venda | 947 | "Meta ÷ Kiwify" |

## Dados Disponíveis

A tabela `sales` possui o campo `source` com valores possíveis:
- `kiwify`
- `hotmart`
- `guru`

Os dados de vendas já são carregados em `filteredSales` e incluem o campo `source`.

---

## Solução

### 1. Criar função para detectar fontes ativas

```typescript
// Dentro do useMemo de calculatedMetrics ou separado
const salesSources = useMemo(() => {
  const sources = new Set<string>();
  filteredSales?.forEach(s => {
    if ((s as any).source) {
      sources.add((s as any).source);
    }
  });
  return sources;
}, [filteredSales]);
```

### 2. Criar helper para formatar label

```typescript
const formatSalesSourceLabel = (sources: Set<string>): string => {
  const sourceNames: Record<string, string> = {
    kiwify: 'Kiwify',
    hotmart: 'Hotmart',
    guru: 'Guru',
    eduzz: 'Eduzz',
  };
  
  if (sources.size === 0) return 'Checkout';
  if (sources.size === 1) {
    const source = Array.from(sources)[0];
    return sourceNames[source] || source;
  }
  return 'Multi-checkout';
};
```

### 3. Atualizar os KpiCards

```tsx
// Linha 946
<KpiCard 
  title="Vendas" 
  value={totalSales} 
  subtitle={formatSalesSourceLabel(salesSources)}  // Era: "Kiwify"
  icon={ShoppingCart} 
  variant="success" 
/>

// Linha 947
<KpiCard 
  title="Custo/Venda" 
  value={formatCurrency(custoPerVenda)} 
  subtitle={`Meta ÷ ${formatSalesSourceLabel(salesSources)}`}  // Era: "Meta ÷ Kiwify"
  icon={DollarSign} 
  variant="success" 
/>
```

---

## Resultado Visual

| Cenário | Card "Vendas" | Card "Custo/Venda" |
|---------|--------------|-------------------|
| Só Kiwify | "Kiwify" | "Meta ÷ Kiwify" |
| Só Guru | "Guru" | "Meta ÷ Guru" |
| Só Hotmart | "Hotmart" | "Meta ÷ Hotmart" |
| Multi-checkout | "Multi-checkout" | "Meta ÷ Multi-checkout" |
| Sem vendas | "Checkout" | "Meta ÷ Checkout" |

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ProjectView.tsx` | Adicionar useMemo para detectar fontes + helper de formatação + atualizar KpiCards |

---

## Detalhes Técnicos

### Localização das mudanças

1. **Linha ~430-445**: Adicionar useMemo para `salesSources`
2. **Linha ~555-565**: Adicionar helper `formatSalesSourceLabel`
3. **Linhas 946-948**: Atualizar subtítulos dos KpiCards
