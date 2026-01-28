
# Plano de Redesign Profissional - Dashboard de Projetos

## Visão Geral

Transformação completa da página de Dashboard para um design enterprise com paleta roxa, tipografia Poppins/Inter, cards profissionais com avatares, métricas com ícones coloridos, badges de status e micro-interações avançadas.

---

## Fase 1: Fundação do Design System

### 1.1 Tipografia (Poppins + Inter)

**Arquivo: `index.html`**
- Adicionar Google Fonts Poppins + Inter
- Remover Lato atual

**Arquivo: `tailwind.config.ts`**
- `font-sans: ['Inter', 'system-ui', 'sans-serif']` (corpo)
- `font-display: ['Poppins', 'system-ui', 'sans-serif']` (títulos)

### 1.2 Paleta Roxa MetrikaPRO

**Arquivo: `src/index.css`**

Novas variáveis CSS:
```text
Light Mode:
--primary: 263 70% 50%           (#8B5CF6 - Roxo vibrante)
--primary-dark: 263 70% 42%      (#7C3AED - Hover)
--primary-light: 263 70% 60%     (#A78BFA - Light)

Gradientes:
--gradient-primary: linear-gradient(135deg, #8B5CF6, #6D28D9)
--gradient-success: linear-gradient(135deg, #22C55E, #16A34A)
```

### 1.3 Classes Utilitárias

Adicionar em `src/index.css`:
- `.shadow-purple` - sombra roxa para hover
- `.card-elevate` - efeito de elevação (-4px)
- `.animate-shimmer` - animação de loading
- `.font-poppins` - classe para Poppins

---

## Fase 2: Componentes Reutilizáveis

### 2.1 Novo Componente: ProjectCard

**Arquivo: `src/components/dashboard/ProjectCard.tsx`**

Estrutura do card:
```text
┌─────────────────────────────────────────────┐
│ ██████ (barra colorida 2px: roxo/verde/vermelho)
├─────────────────────────────────────────────┤
│ [RT] Roberley - TiozãodaIA      [⋮]        │
│      ⏰ Atualizado há 2 horas               │
├─────────────────────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌───────┐               │
│ │💰     │ │📉     │ │📊     │               │
│ │Fatur. │ │Invest.│ │ROAS   │               │
│ │R$450  │ │R$320  │ │1.41x  │               │
│ │—      │ │—      │ │✓ Lucr │               │
│ └───────┘ └───────┘ └───────┘               │
├─────────────────────────────────────────────┤
│ [Meta Ads] [Hotmart]    [Ver Dashboard →]   │
└─────────────────────────────────────────────┘
```

Props:
- `project` - dados do projeto
- `metrics` - { revenue, spend, roas }
- `integrations` - array de tipos conectados
- `onDelete` - callback para deletar
- `onClick` - callback para navegação

Features:
- Avatar com iniciais (gradiente roxo)
- Barra colorida no topo baseada no ROAS
- Grid 3 colunas para métricas com ícones em fundo pastel
- Tags de integrações conectadas
- Hover: `translateY(-4px)` + sombra roxa

### 2.2 Componente: PlanCard Premium

**Arquivo: `src/components/dashboard/PlanCard.tsx`**

Design:
- Gradiente roxo para indigo
- Ícone Crown em fundo branco/20
- Barra de progresso de projetos
- Efeito de brilho (círculo blur)
- Botão upgrade se não for plano máximo

### 2.3 Componente: DashboardHeader

**Arquivo: `src/components/dashboard/DashboardHeader.tsx`**

Features:
- Saudação personalizada: "Olá, {nome}! 👋"
- Subtítulo: "Aqui está o resumo dos seus X projetos"
- Cards de resumo: Faturamento Total + ROAS Médio
- Gradientes roxo e verde nos cards de resumo

### 2.4 Componente: NewProjectCard

**Arquivo: `src/components/dashboard/NewProjectCard.tsx`**

Design:
- Borda tracejada
- Ícone Plus em círculo
- Hover: borda roxa, fundo roxo claro

---

## Fase 3: Queries Adicionais

### 3.1 Buscar Integrações por Projeto

Adicionar query em `Dashboard.tsx`:
```typescript
const { data: projectIntegrations } = useQuery({
  queryKey: ['project-integrations', projects?.map(p => p.id)],
  queryFn: async () => {
    const { data } = await supabase
      .from('integrations')
      .select('project_id, type, is_active')
      .in('project_id', projects?.map(p => p.id) || [])
      .eq('is_active', true);
    return data;
  },
  enabled: !!projects?.length,
});
```

### 3.2 Buscar Nome do Usuário

Adicionar query para perfil:
```typescript
const { data: profile } = useQuery({
  queryKey: ['user-profile', user?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();
    return data;
  },
  enabled: !!user,
});
```

---

## Fase 4: Refatoração do Dashboard.tsx

### 4.1 Estrutura do Layout

```text
┌─────────────────────────────────────────────────────────┐
│ HEADER (logo + actions)                                 │
├─────────────────────────────────────────────────────────┤
│ DASHBOARD HEADER                                        │
│ ┌────────────────────────────┬────────────────────────┐ │
│ │ Olá, Victor! 👋            │ [Fatur.] [ROAS Médio]  │ │
│ │ Resumo de 5 projetos       │ R$1.593  0.72x        │ │
│ └────────────────────────────┴────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ PLAN CARD (gradiente premium)                           │
├─────────────────────────────────────────────────────────┤
│ SEUS PROJETOS                                           │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│ │ ProjectCard │ │ ProjectCard │ │ ProjectCard │         │
│ └─────────────┘ └─────────────┘ └─────────────┘         │
│ ┌─────────────┐                                         │
│ │NewProjectCard│                                        │
│ └─────────────┘                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Cálculos de Métricas Globais

Adicionar `useMemo` para:
- Faturamento Total: soma de todos os projetos
- ROAS Médio: média ponderada
- Contagem de projetos lucrativos/negativos

---

## Fase 5: Atualização do Badge

### 5.1 Variantes de Badge

**Arquivo: `src/components/ui/badge.tsx`**

Adicionar variantes:
- `trend-up` - verde com ícone ↑
- `trend-down` - vermelho com ícone ↓
- `integration` - estilo para tags (Meta Ads, Hotmart, etc.)

---

## Fase 6: Empty State Aprimorado

### 6.1 Design do Empty State

Quando não há projetos:
- Ilustração SVG ou ícone grande
- Título: "Nenhum projeto ainda"
- Descrição explicativa
- Botão CTA com gradiente

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `index.html` | Atualizar fonts |
| `tailwind.config.ts` | Adicionar font-family |
| `src/index.css` | Nova paleta roxa + utilitários |
| `src/components/ui/badge.tsx` | Adicionar variantes |
| `src/components/dashboard/ProjectCard.tsx` | Criar |
| `src/components/dashboard/PlanCard.tsx` | Criar |
| `src/components/dashboard/DashboardHeader.tsx` | Criar |
| `src/components/dashboard/NewProjectCard.tsx` | Criar |
| `src/pages/Dashboard.tsx` | Refatorar completo |

---

## Dependências de Dados

### Tabelas Utilizadas
- `projects` - dados dos projetos
- `profiles` - nome do usuário (full_name)
- `integrations` - tipos conectados por projeto (type, is_active)
- `sales` / `ad_spend` - métricas (já implementado)

### Campos da Tabela Integrations
```text
- id: string
- project_id: string
- type: string (meta_ads, hotmart, kiwify, guru, eduzz)
- is_active: boolean
```

---

## Resultado Esperado

1. **Visual Premium**: Gradientes roxos, sombras sutis, tipografia refinada
2. **Hierarquia Clara**: Cards com avatares, métricas organizadas em grid
3. **Feedback Visual**: Cores semânticas (verde=lucro, vermelho=negativo)
4. **Contexto Rico**: Tags de integrações, timestamps relativos
5. **Micro-interações**: Hover com elevação, transições suaves 300ms
6. **Responsividade**: 1 coluna mobile, 2 tablet, 3 desktop
