
# Plano: Corrigir Configuração do Projeto Adri

## Problema Identificado

O projeto "CA 01 - Adri e Katia" tem o ticket price configurado (R$27), mas o flag `use_gross_for_roas` está **desativado**, o que impede o uso do ticket price no cálculo do faturamento.

## Solução

Duas opções:

### Opção 1: Ativar o Flag na Base de Dados (Rápido)

Executar SQL para ativar `use_gross_for_roas` no projeto da Adri:

```sql
UPDATE projects 
SET use_gross_for_roas = true 
WHERE id = '2caa79a7-1af8-48f9-b839-6e4ab58739b2';
```

### Opção 2: Mudar a Lógica do Código (Recomendado)

Alterar o código para usar o ticket price **sempre que ele estiver configurado**, independente do flag `use_gross_for_roas`.

**Mudança em `src/pages/ProjectView.tsx` e `src/pages/PublicDashboard.tsx`:**

```typescript
// ANTES: Exige ambas as condições
const totalRevenue = (ticketPrice && useGrossForRoas) 
  ? (filteredSales?.length || 0) * ticketPrice 
  : ...

// DEPOIS: Ticket price tem prioridade
const totalRevenue = ticketPrice 
  ? (filteredSales?.length || 0) * ticketPrice 
  : useGrossForRoas 
    ? filteredSales?.reduce((sum, s) => sum + Number((s as any).gross_amount || s.amount), 0) || 0
    : filteredSales?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
```

**Lógica proposta:**
1. Se tem ticket price configurado → usa `vendas × ticket`
2. Se não tem ticket mas `use_gross_for_roas` → usa soma de `gross_amount`
3. Senão → usa soma de `amount` (líquido individual)

## Recomendação

A **Opção 2** é melhor porque:
- Ticket price sempre tem prioridade quando configurado
- `use_gross_for_roas` passa a controlar apenas qual valor somar (bruto vs líquido) quando não há ticket
- Comportamento mais intuitivo para o usuário

## Arquivos a Modificar

1. `src/pages/ProjectView.tsx` - Linha ~382
2. `src/pages/PublicDashboard.tsx` - Linha ~277

## Resultado Esperado

Após a mudança, o projeto da Adri vai calcular:
- **57 vendas × R$27 = R$1.539,00** (igual ao Sexólogo)

Ambos os projetos terão comportamento consistente.
