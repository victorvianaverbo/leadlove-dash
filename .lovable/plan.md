

## Causa raiz real

Confirmado pela screenshot do console e pela inspeção do projeto:

- O `.env` **existe e está correto** no sandbox de preview (por isso o editor funciona).
- Mas o `.env` está **listado no `.gitignore`** (linha 27).
- Quando a Lovable faz o build de publish a partir do repositório git, o `.env` **não está lá** → Vite não substitui `import.meta.env.VITE_SUPABASE_*` → bundle sai com `undefined` → `createClient` lança `supabaseUrl is required` → tela branca.

O `env-guard` que adicionei não pegou porque o `client.ts` é importado por chunks lazy (Dashboard, Auth, etc.), não pelo `main.tsx` diretamente. O erro acontece quando o chunk lazy tenta resolver o módulo, depois do guard já ter passado.

## Por que o "Publish → Update" sozinho não resolve

Não tem como resolver: o pipeline de publish lê o git, e o `.env` nunca está lá. Cada publish vai gerar o mesmo bundle quebrado.

## Correção (recomendada pela própria base da Lovable para stack Vite)

### 1) Remover `.env` do `.gitignore`
- Apagar a linha `.env` do `.gitignore` (mantendo `.env.local` e `.env.*.local` que são para overrides locais).
- O `.env` passa a fazer parte do repositório e fica disponível no build de publish.
- **Segurança**: as variáveis em questão (`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`) são **públicas por definição** — o prefixo `VITE_` significa que vão para o bundle do navegador de qualquer forma. A anon key do Supabase é projetada para ser pública e protegida por RLS no banco. Não há vazamento de segredo.

### 2) Reforçar o guard para cobrir chunks lazy
- O `env-guard.ts` atual cobre o boot do `main.tsx`, mas não os chunks lazy que importam `client.ts`.
- Solução: envolver o `createClient` em `client.ts` num try/catch que, se falhar, dispare o mesmo guard de tela amigável que já existe.
- Isso evita tela branca silenciosa caso o `.env` volte a sumir por qualquer motivo no futuro.

### 3) Republicar
- Após o commit do `.env` (automático na próxima publicação), clicar em **Publish → Update**.
- O novo bundle terá as credenciais inline.

## Validação pós-publish
Vou rodar `curl` no novo `index-[hash].js` e confirmar que contém `ohwaygqxelyaytljbcsb`. Se sim, dashboard volta.

## Arquivos alterados
- `.gitignore` — remover linha `.env` (manter `.env.local` e `.env.*.local`).
- `src/integrations/supabase/client.ts` — try/catch ao redor do `createClient` que invoca o guard se falhar.

## O que o usuário precisa fazer
1. Aprovar este plano.
2. Após eu aplicar as mudanças, clicar em **Publish → Update**.
3. Aguardar ~1 min e abrir `metrikapro.com.br` em aba anônima.

