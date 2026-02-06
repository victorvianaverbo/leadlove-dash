

## Corrigir crash na pagina Admin e sincronizar email no Stripe

### Problema 1 - Logout ao acessar /admin
A funcao `getFreshToken()` em `Admin.tsx` chama `supabase.auth.refreshSession()` antes de cada chamada a edge function. Essa chamada pode falhar e disparar o evento `SIGNED_OUT` no `onAuthStateChange` do AuthContext, que limpa o usuario e redireciona para `/auth`.

### Problema 2 - Projetos "sumindo" apos troca de email
O `check-subscription` busca o cliente Stripe pelo email. Ao trocar o email no admin, o Stripe continua com o email antigo, retornando `subscribed: false` e escondendo os projetos.

---

### Correcao 1 - Remover `refreshSession()` do Admin.tsx

No arquivo `src/pages/Admin.tsx`, remover a funcao `getFreshToken` e usar diretamente `session.access_token`. O token ja e valido (o usuario acabou de logar) e o refresh proativo no AuthContext ja cuida da renovacao a cada 10 minutos.

Alterar as 3 chamadas de `getFreshToken()` para usar `session.access_token` diretamente:

```typescript
// Antes:
const freshToken = await getFreshToken();
const { data, error } = await supabase.functions.invoke("admin-users", {
  headers: { Authorization: `Bearer ${freshToken}` },
});

// Depois:
const { data, error } = await supabase.functions.invoke("admin-users", {
  headers: { Authorization: `Bearer ${session.access_token}` },
});
```

Remover a funcao `getFreshToken` inteiramente.

### Correcao 2 - Sincronizar email no Stripe ao editar usuario

No arquivo `supabase/functions/admin-users/index.ts`, na funcao `handlePut`, ao atualizar o email:

1. Buscar o email atual do usuario no banco (profiles) ANTES de atualizar
2. Buscar o cliente Stripe pelo email antigo
3. Se encontrar, atualizar o email do cliente no Stripe para o novo email
4. So entao prosseguir com a atualizacao no auth e profiles

Isso garante que a assinatura continue sendo encontrada apos a troca de email.

### Correcao 3 - Mostrar projetos mesmo sem assinatura ativa

No arquivo `src/pages/Dashboard.tsx`, alterar a condicao para que projetos existentes sempre aparecam. O EmptyState sem assinatura so aparece se o usuario nao tiver nenhum projeto:

```typescript
// Antes:
{!subscribed ? (
  <EmptyState hasSubscription={false} />
) : projects?.length === 0 ? (

// Depois:
{!subscribed && (!projects || projects.length === 0) ? (
  <EmptyState hasSubscription={false} />
) : projects?.length === 0 ? (
```

### Correcao imediata para o Bruno

Apos o deploy, editar o Bruno novamente pelo painel admin (pode ser so salvar sem mudar nada). A funcao corrigida ira sincronizar o email no Stripe automaticamente.

### Arquivos alterados
- `src/pages/Admin.tsx` - remover getFreshToken, usar session.access_token
- `supabase/functions/admin-users/index.ts` - adicionar sync de email no Stripe
- `src/pages/Dashboard.tsx` - mostrar projetos sem assinatura

