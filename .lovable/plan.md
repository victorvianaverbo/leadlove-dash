

## Correção confirmada pelo suporte da Lovable

O suporte confirmou: remover `.env` do `.gitignore` resolve a tela branca em produção.

## Mudança

**`.gitignore`** — remover a linha `.env` (linha 27), mantendo `.env.local` e `.env.*.local` (essas continuam ignoradas, são para overrides locais).

Antes:
```
.env
.env.local
.env.*.local
```

Depois:
```
.env.local
.env.*.local
```

## Por que é seguro

As variáveis no `.env` deste projeto são **públicas por design**:
- `VITE_SUPABASE_URL` — URL pública do backend
- `VITE_SUPABASE_PUBLISHABLE_KEY` — anon key, projetada para ir ao navegador
- `VITE_SUPABASE_PROJECT_ID` — identificador público

O prefixo `VITE_` significa que o Vite injeta essas variáveis no bundle do navegador de qualquer forma. Quem abre o site já vê esses valores no DevTools. A segurança real do backend está nas RLS policies do banco, não em esconder a anon key.

Nenhum segredo sensível (service role key, Stripe secret, tokens de OAuth) está no `.env` — esses ficam em Edge Function secrets, que continuam protegidos.

## Passos

1. Aprovar este plano.
2. Eu removo a linha `.env` do `.gitignore`.
3. Você clica em **Publish → Update**.
4. Eu valido via curl que o novo bundle contém `ohwaygqxelyaytljbcsb` e confirmo que `metrikapro.com.br/dashboard` voltou.

