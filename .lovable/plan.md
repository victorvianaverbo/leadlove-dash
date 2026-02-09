

# Tabela de Vendas por UTM nos Dashboards

## O que sera feito

Adicionar uma tabela de vendas agrupadas por UTM Source e UTM Campaign abaixo dos dashboards privado (ProjectView) e publico (PublicDashboard). A tabela mostra de onde vieram as vendas, permitindo ao usuario entender quais fontes de trafego estao performando melhor.

## Como vai funcionar

A tabela agrupa as vendas ja carregadas (filtradas por periodo e status "paid") por `utm_source` e `utm_campaign`, mostrando:

| UTM Source | UTM Campaign | Vendas | Receita | % do Total |
|------------|-------------|--------|---------|------------|
| ig         | campanha-x  | 38     | R$ 419  | 82%        |
| facebook   | black-friday| 5      | R$ 160  | 14%        |
| (direto)   | -           | 2      | R$ 64   | 4%         |

- Os dados vem das vendas ja carregadas na pagina (sem queries adicionais ao banco)
- Responde ao filtro de periodo selecionado (7d, 30d, etc.)
- Vendas sem UTM aparecem como "(direto)" ou "(sem UTM)"
- Usa o componente `PaginatedTable` ja existente no projeto
- Ordenado por numero de vendas (maior primeiro)

## Plano tecnico

### 1. Criar componente `SalesByUtmTable`

**Arquivo:** `src/components/tables/SalesByUtmTable.tsx`

Componente que recebe um array de vendas e calcula o agrupamento por UTM. Props:
- `sales`: array de vendas (ja filtradas por periodo e status)
- `formatCurrency`: funcao de formatacao monetaria
- `ticketPrice`: preco fixo do ticket (se configurado)
- `useGrossForRoas`: flag para usar valor bruto

Logica interna:
- Agrupa vendas por `utm_source + utm_campaign`
- Calcula receita usando a mesma logica de prioridade existente (ticket price > gross > net)
- Calcula percentual sobre o total
- Ordena por quantidade de vendas (decrescente)
- Renderiza usando `PaginatedTable` com paginacao

### 2. Inserir no Dashboard Privado (ProjectView)

**Arquivo:** `src/pages/ProjectView.tsx`

Inserir o componente `SalesByUtmTable` logo apos a secao de "Acoes Recomendadas da IA" (apos a linha ~1116), passando `filteredSales`, `formatCurrency`, `ticketPrice` e `useGrossForRoas`.

Envolver em um Card com titulo "Vendas por Origem (UTM)" e um icone de filtro.

### 3. Inserir no Dashboard Publico (PublicDashboard)

**Arquivo:** `src/pages/PublicDashboard.tsx`

Inserir o mesmo componente antes do "Powered by" badge (antes da linha ~681), usando `filteredAllSales` (vendas totais do periodo). No dashboard publico, utilizar a mesma logica de `getSaleValue` para calculo de receita.

### 4. Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/tables/SalesByUtmTable.tsx` | Criar - componente da tabela UTM |
| `src/pages/ProjectView.tsx` | Editar - inserir tabela apos secao de IA |
| `src/pages/PublicDashboard.tsx` | Editar - inserir tabela antes do "Powered by" |

### 5. Colunas da tabela

| Coluna | Descricao |
|--------|-----------|
| Origem (Source) | `utm_source` ou "(direto)" se vazio |
| Campanha | `utm_campaign` ou "-" se vazio |
| Vendas | Contagem de vendas pagas |
| Receita | Valor total (respeitando logica de prioridade) |
| % do Total | Percentual da receita sobre o total |

### 6. Consideracoes

- Nenhuma query adicional ao banco - usa dados ja carregados
- Componente reutilizavel entre ambos dashboards
- Respeita a logica existente de revenue calculation priority (ticket price > gross > net)
- Paginacao com `PaginatedTable` para projetos com muitas origens
- No dashboard publico, usa a view `sales_public` que ja inclui campos UTM sem expor PII

