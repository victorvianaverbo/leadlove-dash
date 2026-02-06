
# Plano: Visão Administrativa de Todos os Projetos

## Objetivo
Criar uma página administrativa em `/admin/projects` (rota escondida, sem botão no frontend) que permite visualizar e acessar todos os projetos de todos os clientes para suporte técnico.

---

## Acesso
- **Login:** Seu login atual de administrador
- **Rota:** `/admin/projects` (acessar diretamente pela URL)
- **Sem botão no frontend** - rota oculta para acesso direto

---

## Arquitetura

```text
┌──────────────────────────────────────────────────────────────┐
│  /admin/projects (rota escondida)                            │
├──────────────────────────────────────────────────────────────┤
│  Buscar: [_______________]  Plataforma: [▼ Todas]            │
├──────────────────────────────────────────────────────────────┤
│  Projeto        │ Cliente        │ Integrações │ Ações       │
│  ─────────────────────────────────────────────────────────── │
│  Curso XYZ      │ Charles Silva  │ Kiwify,Meta │ [Acessar]   │
│  Plataforma IRD │ João           │ Hotmart     │ [Acessar]   │
└──────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Atualizar Políticas RLS

Adicionar políticas que permitem admins visualizarem dados de qualquer projeto:

**Tabela projects:**
```sql
CREATE POLICY "Admins can view all projects"
ON public.projects FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

**Tabela sales:**
```sql
CREATE POLICY "Admins can view all sales"
ON public.sales FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

**Tabela ad_spend:**
```sql
CREATE POLICY "Admins can view all ad_spend"
ON public.ad_spend FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

**Tabela integrations:**
```sql
CREATE POLICY "Admins can view all integrations"
ON public.integrations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all integrations"
ON public.integrations FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

A função `has_role()` já existe no projeto e usa `SECURITY DEFINER` para evitar recursão RLS.

---

## Fase 2: Criar Edge Function `admin-projects`

**Arquivo:** `supabase/functions/admin-projects/index.ts`

Funcionalidades:
- Listar todos os projetos com dados do proprietário (nome, email)
- Incluir integrações ativas de cada projeto
- Filtrar por nome do projeto ou cliente

Retorno:
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Curso XYZ",
      "slug": "curso-xyz",
      "created_at": "2026-01-15",
      "owner": {
        "user_id": "uuid",
        "full_name": "Charles Silva",
        "email": "charles@email.com"
      },
      "integrations": ["kiwify", "meta_ads"]
    }
  ]
}
```

---

## Fase 3: Criar Página AdminProjects

**Arquivo:** `src/pages/AdminProjects.tsx`

Funcionalidades:
- Listagem de todos os projetos com paginação
- Busca por nome do projeto ou cliente
- Coluna com nome e email do proprietário
- Coluna com integrações ativas (badges)
- Botão "Acessar" que abre `/projects/:id`
- Botão "Sincronizar" para forçar sync de dados
- Verificação de admin igual ao `/admin` existente

Layout similar ao `Admin.tsx` existente:
- Header com título e voltar
- Card com tabela de projetos
- Campo de busca
- Design consistente

---

## Fase 4: Atualizar ProjectView para Modo Admin

**Arquivo:** `src/pages/ProjectView.tsx`

Modificações:
- Detectar se admin está visualizando projeto de outro usuário
- Mostrar banner "Visualizando como Admin - Cliente: [nome]"
- Permitir sincronização e debug
- Esconder botão de exclusão (segurança)
- Permitir editar integrações do cliente

```typescript
const isViewingAsAdmin = project?.user_id !== user?.id && isAdmin;
```

---

## Fase 5: Adicionar Rota

**Arquivo:** `src/App.tsx`

Adicionar a rota escondida:
```typescript
<Route path="/admin/projects" element={<AdminProjects />} />
```

---

## Resumo das Alterações

| Componente | Ação | Descrição |
|------------|------|-----------|
| RLS Policies | Migração SQL | 5 novas policies para role admin |
| `admin-projects/index.ts` | Criar | Edge function para listar projetos |
| `AdminProjects.tsx` | Criar | Página de gestão de projetos |
| `ProjectView.tsx` | Editar | Modo admin com banner e permissões |
| `App.tsx` | Editar | Adicionar rota `/admin/projects` |
| `AuthContext.tsx` | Já existe | `isAdmin` já disponível no contexto |

---

## Segurança

- Verificação de admin via `has_role()` (SECURITY DEFINER)
- RLS policies garantem isolamento de usuários normais
- Ações destrutivas (DELETE) bloqueadas no modo admin
- Edge function valida JWT antes de qualquer operação

---

## Fluxo de Uso

1. Acesse `https://metrikapro.com.br/admin/projects`
2. Busque pelo nome do cliente (ex: "Charles")
3. Clique em "Acessar" no projeto desejado
4. Visualize e corrija problemas (integrações, sync, etc.)
5. Banner indica que está em modo admin
