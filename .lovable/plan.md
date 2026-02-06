
## Reestruturar Dashboard Publico + Adicionar Acoes Recomendadas no Dashboard Principal

### 1. PublicDashboard.tsx - Reorganizar secoes

**Remover** a secao "Analise dos Ultimos 3 Dias" (linhas 512-576) com metricas medias e resumo da IA.

**Adicionar** secao "Ontem" entre Hoje e Acumulado:
- Nova query `public-sales-yesterday` buscando vendas com `gte(brasiliaToUTC(yesterday))` e `lt(brasiliaToUTC(today))`
- Nova query `public-ad-spend-yesterday` buscando gastos com `eq('date', yesterday)`
- Calcular `yesterdayRevenue`, `yesterdaySpend`, `yesterdayRoas`, `yesterdayCpa`, `yesterdaySalesCount`
- Card com borda neutra (`border-border`), 5 metricas no mesmo grid do card de hoje

**Layout final:**
1. Resumo de Hoje (sem alteracoes)
2. Ontem (novo)
3. Acumulado do Periodo (sem alteracoes)
4. Acoes Recomendadas (sem alteracoes, continua usando dados dos 3 dias do relatorio da IA)

### 2. ProjectView.tsx - Adicionar Acoes Recomendadas

**Adicionar query** para buscar o `daily_report` mais recente do projeto (igual ao PublicDashboard).

**Adicionar secao** apos o Funil de Midia (antes do DeleteProjectDialog, ~linha 1024) com:
- Card com destaque visual: borda `border-primary/30`, fundo `bg-gradient-to-r from-primary/5 to-transparent`
- Header com icone Sparkles roxo, titulo "Acoes Recomendadas da IA" e badge "Diferencial MetrikaPRO"
- Subtitulo: "Baseado na analise automatica dos ultimos 3 dias do seu funil"
- Lista de acoes recomendadas no mesmo formato do PublicDashboard (metrica + benchmark, prioridade, acao, motivo)
- Componentes `PriorityBadge` e layout de acao reutilizados (copiados inline no arquivo)
- Se nao houver relatorio, mostrar card convidando a sincronizar primeiro

### Detalhes tecnicos

**PublicDashboard - Queries de ontem:**
```text
sales: .gte('sale_date', brasiliaToUTC(yesterday)).lt('sale_date', brasiliaToUTC(today))
ad_spend: .eq('date', yesterday)
```

**ProjectView - Query do relatorio:**
```text
supabase.from('daily_reports').select('*')
  .eq('project_id', projectId)
  .order('report_date', { ascending: false })
  .limit(1).single()
```

**Destaque visual no ProjectView** para reforcar o diferencial da ferramenta:
- Gradiente roxo sutil no card
- Badge "IA" ou "Diferencial MetrikaPRO" no header
- Icone Sparkles animado com `text-primary`
