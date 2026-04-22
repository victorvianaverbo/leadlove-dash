

# Redesign Premium MetrikaPRO — apenas camada visual

Vou elevar o visual de todo o app aplicando uma identidade premium inspirada em Linear/Vercel/Stripe/Attio/Mercury/Tremor. **Zero mudança de lógica, rotas, queries, schemas ou props.** Apenas tokens, tipografia, espaçamento, hierarquia e micro-interações.

## Etapa 1 — Fundação (tokens + tipografia)

**`src/index.css`**
- Substituir paleta HSL pelas novas variáveis: `--background`, `--surface`, `--foreground`, `--muted`, `--border`, `--primary` (262 83% 58%), `--primary-hover`, `--primary-soft`, `--midnight` (230 45% 18%), `--midnight-soft`, `--success` refinado, `--destructive` menos berrante, `--warning`, `--info`, `--ring`.
- Preservar bloco `.dark` (mesma estrutura, só re-tonalizado).
- Atualizar utilities: `gradient-hero`, `gradient-kpi-premium`, `shadow-xs/sm/md`, `shadow-purple`.
- Adicionar `font-variant-numeric: tabular-nums` global em `.tabular`, tabelas, e em `[data-kpi]`.
- Importar Inter Tight via Google Fonts (display) mantendo Inter (body).
- Refinar `animate-pulse` (amplitude menor) e `fade-in` 300ms.

**`tailwind.config.ts`**
- Trocar `display: ['Poppins']` → `display: ['Inter Tight', 'Inter', ...]`.
- Adicionar cores `midnight`, `midnight-soft`, `primary-hover`, `primary-soft`, `success-soft`.
- Adicionar `boxShadow.xs/sm/md/purple` com novos valores.
- Manter todo o resto.

**`index.html`**
- Trocar `<link>` do Google Fonts: Inter Tight + Inter (Poppins fica como fallback ou removida).

## Etapa 2 — shadcn primitives (variantes, não reescrita)

- **Button** (`src/components/ui/button.tsx`): refinar variant `default` (brilho sutil hover 150ms), `outline` (border-muted), adicionar shadow-xs em primary.
- **Card** (`src/components/ui/card.tsx`): `rounded-xl`, `shadow-xs` default, `p-6` no header/content padrão.
- **Input** (`src/components/ui/input.tsx`): `rounded-lg`, `border-border`, foco `ring-primary ring-2`.
- **Badge** (`src/components/ui/badge.tsx`): adicionar variantes `success-soft`, `warning-soft`, `destructive-soft`, `midnight`.
- **KpiCard** (`src/components/ui/kpi-card.tsx`): refinar hierarquia — label `text-xs muted uppercase tracking-wide`, valor `text-3xl font-semibold tabular-nums`, ícone em círculo `primary-soft p-2.5`. Adicionar prop opcional `premium` que aplica `gradient-kpi-premium + shadow-purple`.
- **Skeleton**: amplitude pulse menor.

Lucide: passar `strokeWidth={1.5}` onde necessário via wrapper utility (ou ajustar nos pontos críticos).

## Etapa 3 — Páginas (apenas JSX/className, zero hooks/queries)

**Landing `src/pages/Index.tsx`**
- Hero com `gradient-hero`, copy branca, mockup com `backdrop-blur` + `shadow-purple`.
- Features em grid 3 col, ícones em círculo `primary-soft`.
- Pricing 4 cards lado a lado, recomendado com border-primary + badge `midnight`.
- Social proof bar com logos desaturados.

**Auth (`Auth.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`)**
- Split 50/50: form à esquerda (branco), painel direito com `gradient-hero` + depoimento branco.
- Labels `text-xs font-medium uppercase tracking-wide`.

**Dashboard `src/pages/Dashboard.tsx`**
- `PlanCard` (`src/components/dashboard/PlanCard.tsx`) → faixa horizontal slim com progress de 4px roxa + botão upgrade ghost.
- `ProjectCard` (`src/components/dashboard/ProjectCard.tsx`): nome `font-semibold text-lg`, pills de plataformas desaturadas, 3 KPIs em linha com `tabular-nums`, footer com ponto colorido + "sincronizado há X". Hover `-translate-y-0.5 shadow-md`.
- `NewProjectCard`: dashed border-primary + ícone `+` em círculo `primary-soft`.
- `EmptyState`: layout mais arejado, CTA primário.

**Project View `src/pages/ProjectView.tsx` — PRIORIDADE**
- Header sticky glass: `sticky top-0 bg-background/80 backdrop-blur border-b`. Breadcrumb + nome do projeto + Popover de filtro de data ("Últimos 30 dias ▼") + grupo de botões Atualizar/Editar/⋯.
- 5 KPI Cards: Faturamento e ROAS usando `<KpiCard premium />`, demais normais. Cada um com delta vs período anterior (seta ↑/↓).
- **NOVO bloco visual**: `AreaChart` (Recharts) com `<Tabs>` no topo (Faturamento/ROAS/Gasto/Vendas) — alimentado pelos mesmos dados já presentes em memória, **sem novas queries**. Gradient roxo→transparente, grid tracejada, tooltip card branco shadow-md, altura 300px.
- Funil de Mídia: 4 cards-container (Awareness/Creative/Consideration/Conversion) com FunnelCards densos.
- Card IA: `gradient-hero` branco, ícone Sparkles, badge "Diferencial MetrikaPRO" `bg-white/10`, ações com prioridade refinada.
- `SalesByUtmTable` (`src/components/tables/SalesByUtmTable.tsx`): tabs em pill, linhas zebra `odd:bg-muted/30`, ordenação com seta, coluna "% do total" com barra horizontal roxa embutida (estilo Tremor) — só className/markup, mesma data.

**Project Edit `src/pages/ProjectEdit.tsx`**
- Seções em `Collapsible` shadcn com ícone de status (CheckCircle verde / Circle cinza) à direita do título.
- Cards de integração (`MetaAdsIntegrationCard`, `SalesIntegrationCard`): logo grande à esquerda, status chip, botão Conectar/Gerenciar à direita.
- Benchmarks: card único com grid de inputs, sufixo `%` visual.

**Public Dashboard `src/pages/PublicDashboard.tsx`**
- Reaproveitar visual do Project View em read-only.
- Header simplificado: logo MetrikaPRO pequeno + nome do projeto + "atualizado há X".
- Remover botões de ação visualmente; mostrar range de data como texto.
- Watermark "Powered by MetrikaPRO" no rodapé linkando para `/`.

**Admin (`Admin.tsx`, `AdminProjects.tsx`)**
- Card único com tabela, header sticky com busca + filtros em pills, row actions em `...` dropdown. Modal `EditUserModal` com seções agrupadas.

**Settings `src/pages/Settings.tsx`**
- Card com seções verticais: Perfil / Segurança / Assinatura, headings consistentes, labels acima.

**Pricing `src/pages/Pricing.tsx`**
- 4 cards no mesmo estilo da landing, fullscreen, toggle mensal/anual mantido se existir.

## Etapa 4 — Verificação

1. Build sem warnings novos.
2. Smoke test visual em `/`, `/auth`, `/dashboard`, `/projects/:slug`, `/projects/:slug/edit`, `/:publicSlug`, `/admin`, `/settings`.
3. Checar 375 / 768 / 1440 px.
4. Confirmar via grep que **nenhum** `useQuery`, `supabase.from`, `useEffect` com fetch, ou edge function call foi alterado.

## Garantias

- Zero alteração em: `src/integrations/supabase/*`, `supabase/functions/*`, `supabase/migrations/*`, hooks de dados (`useMetricsCache`, `AuthContext`), props de componentes existentes.
- Dark mode preservado (vars `.dark` re-tonalizadas mantendo a mesma estrutura de chaves).
- Acessibilidade: contraste AA verificado nos novos tokens, focus ring visível (`ring-primary`), aria-labels existentes intactos.
- Todos os números renderizados com `tabular-nums` (classe utilitária ou `font-variant-numeric` global em tabelas/KPIs).

## Arquivos tocados (resumo)

Tokens: `src/index.css`, `tailwind.config.ts`, `index.html`
Primitives: `button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `kpi-card.tsx`, `skeleton.tsx`
Dashboard: `PlanCard.tsx`, `ProjectCard.tsx`, `NewProjectCard.tsx`, `EmptyState.tsx`, `DashboardHeader.tsx`
Páginas: `Index.tsx`, `Auth.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `Dashboard.tsx`, `ProjectView.tsx`, `ProjectEdit.tsx`, `PublicDashboard.tsx`, `Admin.tsx`, `AdminProjects.tsx`, `Settings.tsx`, `Pricing.tsx`
Tabelas/Integrações: `SalesByUtmTable.tsx`, `MetaAdsIntegrationCard.tsx`, `SalesIntegrationCard.tsx`

Total: ~25 arquivos, todos visuais.

