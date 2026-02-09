

# 4 Tabelas UTM: Source, Campaign, Medium e Content

## O que sera feito

Substituir a tabela unica atual por 4 tabelas separadas, cada uma agrupando vendas por um parametro UTM diferente:

1. **Vendas por Source** - agrupa por `utm_source`
2. **Vendas por Campaign** - agrupa por `utm_campaign`
3. **Vendas por Medium** - agrupa por `utm_medium`
4. **Vendas por Content** - agrupa por `utm_content`

Cada tabela tera 3 colunas: o valor UTM, quantidade de vendas, receita e percentual do total.

## Layout

As 4 tabelas serao organizadas em abas (Tabs) dentro de um unico Card para manter a interface limpa:

```text
+--------------------------------------------------+
|  Vendas por UTM                                  |
|  [Source] [Campaign] [Medium] [Content]          |
|                                                  |
|  Origem      | Vendas | Receita  | % Total      |
|  ig          | 38     | R$ 419   | 82%          |
|  facebook    | 5      | R$ 160   | 14%          |
|  (direto)    | 2      | R$ 64    | 4%           |
|                                                  |
|  Mostrando [10] de 3 registros                   |
+--------------------------------------------------+
```

## Mudancas tecnicas

### 1. Refatorar `SalesByUtmTable.tsx`

**Arquivo:** `src/components/tables/SalesByUtmTable.tsx`

- Atualizar a interface `Sale` para incluir `utm_medium` e `utm_content`
- Criar uma funcao generica de agrupamento que recebe o campo UTM como parametro
- Usar o componente `Tabs` (ja existente no projeto) com 4 abas
- Cada aba renderiza um `PaginatedTable` com dados agrupados pelo respectivo campo UTM
- Colunas de cada aba: Nome do parametro, Vendas, Receita, % do Total

### 2. Atualizar ProjectView.tsx

**Arquivo:** `src/pages/ProjectView.tsx`

- Nenhuma mudanca nas props passadas ao componente (ja passa `sales` com todos os campos UTM)

### 3. Atualizar PublicDashboard.tsx

**Arquivo:** `src/pages/PublicDashboard.tsx`

- Nenhuma mudanca nas props (a view `sales_public` ja inclui `utm_medium` e `utm_content`)

### Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/tables/SalesByUtmTable.tsx` | Refatorar - 4 abas com agrupamento generico |

Apenas 1 arquivo precisa ser alterado, pois a logica fica toda no componente e os dados ja estao disponiveis.

