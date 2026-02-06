

## Corrigir erro 401 na edge function admin-users

### Problema
A funcao `verifyAdmin` cria um cliente Supabase com a **anon key** para validar o token do usuario. No Lovable Cloud, os tokens JWT usam algoritmo ES256 e a anon key (HS256) nao consegue verificar esses tokens, causando o erro "Unauthorized" antes mesmo de checar o role de admin.

### Solucao
Usar o cliente com **service role key** (que ja existe como `supabaseAdmin`) para chamar `auth.getUser(token)`. O service role key tem permissao para validar qualquer token. Isso elimina a necessidade de criar um segundo cliente com a anon key.

### Alteracao

**Arquivo: `supabase/functions/admin-users/index.ts`** (funcao `verifyAdmin`, linhas 15-47)

Simplificar para usar apenas o `supabaseAdmin` (service role):

```
async function verifyAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("No authorization header");

  const token = authHeader.replace("Bearer ", "");

  // Usar service role para validar o token (compativel com ES256 do Lovable Cloud)
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) throw new Error("Unauthorized");

  // ... resto igual (checagem de admin role)
}
```

Remover a criacao do `supabaseClient` com anon key (linhas 25-27) pois nao e mais necessario.

Tambem atualizar o CORS headers para incluir os headers extras do Supabase client:

```
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
```

### Sobre projetos
Nenhuma alteracao afeta projetos dos usuarios. A funcao so modifica email/senha via `auth.admin.updateUserById` e roles/overrides via tabelas separadas. Projetos sao vinculados por `user_id` que nao muda.

### Redeploy
A edge function sera redeployada automaticamente apos a alteracao.
