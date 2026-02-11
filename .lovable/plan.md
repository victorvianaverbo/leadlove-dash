

# Desvincular identidades OAuth ao alterar email pelo Admin

## Problema

Quando o admin altera o email de um usuario, a identidade Google (OAuth) antiga permanece vinculada na tabela `auth.identities`. Isso permite que o usuario continue logando com o Google antigo, ignorando a troca de email.

## Solucao

Adicionar logica na edge function `admin-users` para, ao detectar mudanca de email, listar e remover todas as identidades OAuth (Google, etc.) do usuario via `supabase.auth.admin.deleteIdentity()`.

## Mudanca tecnica

**Arquivo:** `supabase/functions/admin-users/index.ts`

Na funcao `handlePut`, apos atualizar o email no auth e no profile, adicionar:

1. Listar identidades do usuario via `supabase.auth.admin.getUserById(user_id)`
2. Filtrar identidades cujo provider seja diferente de `"email"` (ex: `"google"`)
3. Para cada identidade OAuth encontrada, chamar `supabase.auth.admin.deleteIdentity(identity.id)` (identificador no campo `identity_id` do objeto)
4. Logar quais identidades foram removidas

```text
Fluxo atualizado:

  Admin altera email
       |
       v
  Atualiza Stripe (ja existe)
       |
       v
  Atualiza auth.users (ja existe)
       |
       v
  Atualiza profiles (ja existe)
       |
       v
  [NOVO] Lista identidades do usuario
       |
       v
  [NOVO] Remove identidades OAuth (google, etc.)
       |
       v
  Log de identidades removidas
```

A mudanca fica contida no bloco `if (email !== undefined)` ja existente, logo apos a atualizacao do profile. Nenhum outro arquivo precisa ser alterado.

| Arquivo | Acao |
|---------|------|
| `supabase/functions/admin-users/index.ts` | Adicionar remocao de identidades OAuth apos troca de email |

