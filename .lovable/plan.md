
## Corrigir metricas do Dashboard - filtrar por projetos do usuario

### Problema
As queries de `sales` e `ad_spend` no Dashboard (linhas 163-166) nao filtram por `project_id`. Elas buscam TODOS os registros de TODOS os usuarios do sistema, inflando o faturamento e distorcendo o ROAS.

Dados reais do Bruno (ultimos 30 dias):
- CA 01 Sexologo: 88 vendas x R$27 = R$ 2.376 / gasto R$ 1.933
- Roberley: 1 venda x R$27 = R$ 27 / gasto R$ 464
- CA 01 Adri: 1 venda x R$27 = R$ 27 / gasto R$ 711
- Outros projetos: sem vendas/gastos
- Total correto: ~R$ 2.430 de faturamento

O Dashboard mostra R$ 62.628,41 porque esta somando vendas de outros usuarios.

### Correcao

**Arquivo: `src/pages/Dashboard.tsx` (linhas 163-166)**

Adicionar filtro `.in('project_id', projectIds)` nas duas queries:

```typescript
const projectIds = projects.map(p => p.id);

const [salesResult, spendResult] = await Promise.all([
  supabase.from('sales')
    .select('project_id, amount, gross_amount')
    .eq('status', 'paid')
    .in('project_id', projectIds)
    .gte('sale_date', dateFilter),
  supabase.from('ad_spend')
    .select('project_id, spend')
    .in('project_id', projectIds)
    .gte('date', dateFilter)
]);
```

### Sobre o email no Stripe

O codigo de sincronizacao ja foi adicionado na ultima alteracao. Para corrigir o Bruno:
1. Acessar o painel Admin
2. Editar o usuario Bruno
3. Salvar (pode ser sem alterar nada)
4. A funcao vai detectar o email atual e atualizar no Stripe

Nenhuma alteracao de codigo adicional e necessaria para o Stripe.

### Arquivos alterados
- `src/pages/Dashboard.tsx` - adicionar filtro `.in('project_id', projectIds)` nas queries de sales e ad_spend
