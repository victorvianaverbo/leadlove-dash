
# Correção do Erro 401 na Edge Function `sync-project-data`

## Diagnóstico

O erro **"Failed to send a request to the Edge Function"** é causado por um problema de autenticação na Edge Function `sync-project-data`. Os logs mostram:

| Função | Status | Resultado |
|--------|--------|-----------|
| `check-subscription` | 200 | Funciona corretamente |
| `sync-project-data` | 401 | Falha na autenticação |

## Causa Raiz

A função `sync-project-data` está usando o **cliente errado** para validar o token de autenticação:

```text
PROBLEMA (sync-project-data linha 662):
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);  // <- ERRADO
  const { data: claimsData } = await supabaseAuth.auth.getClaims(token);

CORRETO (check-subscription linha 27-30):
  const supabaseClient = createClient(supabaseUrl, SERVICE_ROLE_KEY); // <- CERTO
  const { data: claimsData } = await supabaseClient.auth.getClaims(token);
```

O método `getClaims()` requer a **Service Role Key** para validar tokens JWT, não a Anon Key.

---

## Solução

### Modificar `supabase/functions/sync-project-data/index.ts`

Alterar a criação do cliente de autenticação para usar `SUPABASE_SERVICE_ROLE_KEY`:

**Antes (linhas 658-663):**
```typescript
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

**Depois:**
```typescript
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Use service key for both auth validation and database operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});
```

E ajustar a validação do token (linha 674):
```typescript
// Antes: await supabaseAuth.auth.getClaims(token);
// Depois:
const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
```

---

## Resultado Esperado

Após a correção:
- A função `sync-project-data` passará a retornar status 200
- A sincronização do projeto Medsimple funcionará corretamente
- As vendas do Guru e Hotmart serão importadas para o banco de dados
