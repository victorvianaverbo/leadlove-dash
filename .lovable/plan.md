

# Plano: Gerenciamento Completo de Usuários Admin

## Objetivo
Adicionar funcionalidades para:
1. Alterar senha de usuários
2. Alterar email de usuários (já existe)
3. Marcar/desmarcar usuários como admin do Metrika

---

## Arquitetura Atual

A estrutura existente já suporta grande parte do que você precisa:

| Componente | Status | Descrição |
|------------|--------|-----------|
| `user_roles` | Existe | Tabela com enum `app_role` ('admin', 'user') |
| `admin-users` | Existe | Edge function que já atualiza email |
| `EditUserModal` | Existe | Modal de edição (precisa expandir) |

---

## Mudanças Necessárias

### Fase 1: Atualizar Edge Function `admin-users`

**Arquivo:** `supabase/functions/admin-users/index.ts`

Adicionar suporte para:
- **Alterar senha** via `supabase.auth.admin.updateUserById(userId, { password })`
- **Toggle admin** via INSERT/DELETE na tabela `user_roles`
- **Retornar status de admin** na listagem de usuários

```typescript
// Novo no PUT:
if (password) {
  await supabaseAdmin.auth.admin.updateUserById(user_id, { password });
}

if (is_admin !== undefined) {
  if (is_admin) {
    // Inserir role admin
    await supabaseAdmin.from("user_roles").upsert({ user_id, role: 'admin' });
  } else {
    // Remover role admin
    await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id).eq("role", "admin");
  }
}
```

Novo campo no retorno GET:
```json
{
  "users": [{
    "is_admin": true,
    ...
  }]
}
```

---

### Fase 2: Atualizar Modal de Edição

**Arquivo:** `src/components/admin/EditUserModal.tsx`

Adicionar campos:
1. **Nova Senha** - Campo password com toggle de visibilidade
2. **Confirmar Senha** - Validação de confirmação
3. **Admin Metrika** - Switch on/off

Layout atualizado:
```text
┌─────────────────────────────────────────┐
│ Editar Usuário                          │
├─────────────────────────────────────────┤
│ Nome: [João Silva        ] (desabilitado)│
│ Email: [joao@email.com   ]              │
│                                         │
│ ─────── Alterar Senha ───────           │
│ Nova Senha: [••••••••    ] 👁           │
│ Confirmar:  [••••••••    ] 👁           │
│                                         │
│ ─────── Permissões ───────              │
│ Admin Metrika: [  ON  ]                 │
│                                         │
│ ─────── Overrides ───────               │
│ Projetos Extras: [  5  ]                │
│ Notas: [________________]               │
├─────────────────────────────────────────┤
│              [Cancelar] [Salvar]        │
└─────────────────────────────────────────┘
```

---

### Fase 3: Atualizar Página Admin

**Arquivo:** `src/pages/Admin.tsx`

Adicionar:
1. **Coluna "Admin"** na tabela com badge
2. **Interface atualizada** para passar `is_admin` e `password`

---

## Fluxo de Dados

```text
EditUserModal
    │
    ├── email (existente)
    ├── password (novo)
    ├── is_admin (novo)
    ├── extra_projects (existente)
    └── notes (existente)
           │
           ▼
    Admin.tsx (handleSaveUser)
           │
           ▼
    Edge Function admin-users (PUT)
           │
           ├── supabase.auth.admin.updateUserById({ email, password })
           ├── profiles.update({ email })
           ├── user_roles.upsert/delete (admin toggle)
           └── user_overrides.upsert (extra_projects, notes)
```

---

## Segurança

| Aspecto | Implementacao |
|---------|---------------|
| Autenticacao | JWT validado na edge function |
| Autorizacao | Verificacao `has_role(user_id, 'admin')` |
| Senha | Minimo 6 caracteres, confirmacao obrigatoria |
| Self-protection | Admin nao pode remover proprio role |

---

## Resumo das Alteracoes

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `admin-users/index.ts` | Editar | Adicionar password e is_admin no PUT, is_admin no GET |
| `EditUserModal.tsx` | Editar | Adicionar campos senha e switch admin |
| `Admin.tsx` | Editar | Adicionar coluna admin, atualizar interface |

---

## Validacoes

- Senha deve ter minimo 6 caracteres
- Confirmacao de senha deve coincidir
- Admin nao pode remover seu proprio acesso admin (protecao)
- Campos de senha sao opcionais (deixar vazio = nao alterar)

