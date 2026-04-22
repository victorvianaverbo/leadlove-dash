

## Diagnóstico confirmado ✅

O Claude acertou na causa: o bundle de produção **não contém** as credenciais do Supabase. Verifiquei os 61 chunks JS publicados em `metrikapro.com.br` — zero ocorrências de `ohwaygqxelyaytljbcsb` ou de qualquer JWT. Quando o `client.ts` faz `createClient(undefined, undefined, ...)`, lança erro síncrono e o React nunca monta. Tela branca com `<title>` preservado é o sintoma exato disso.

**Detalhe interessante**: o `index.html` tem `<link rel="preconnect" href="https://ohwaygqxelyaytljbcsb.supabase.co">` (hardcoded, correto), mas o JS que usaria essa conexão não tem a URL nem a chave. Build inconsistente.

## Onde o Claude errou

A solução dele (`Project Settings → Environment Variables`) **não se aplica a Lovable Cloud**. Em projetos Cloud:
- O arquivo `.env` é **gerado automaticamente** pela plataforma com `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID`.
- Não há UI de "Environment Variables" para o usuário editar essas três — elas são gerenciadas pela própria Lovable.
- "Build Secrets" do workspace existem, mas são para tokens de npm privado, não para essas variáveis.

Ou seja: o `.env` deveria estar correto automaticamente. Se o build saiu sem essas envs, é uma falha no pipeline de publish da Lovable, não algo que você configura manualmente.

## Causas reais prováveis

1. **Build de publish ficou cacheado/quebrado** — o último deploy gerou bundle antes do `.env` ser injetado, ou algo no pipeline falhou silenciosamente.
2. **Drift entre o `.env` do preview e do publish** — preview funciona porque o Vite injeta as envs em runtime; publish congelou um build antigo.

## Plano de correção

### Passo 1 — Republicar (ação do usuário, não-código)
Clicar em **Publish → Update** no canto superior direito do Lovable. Isso força um novo build com o `.env` atualizado. Em 99% dos casos resolve sozinho.

### Passo 2 — Validar o novo bundle
Após publicar, verifico via curl se o novo `index-[hash].js` (hash mudará) contém `ohwaygqxelyaytljbcsb`. Se sim → fim, problema resolvido.

### Passo 3 — Defesa em código (caso o publish volte a quebrar)
Adicionar uma verificação defensiva em `src/integrations/supabase/client.ts` que:
- Detecta se `VITE_SUPABASE_URL` ou `VITE_SUPABASE_PUBLISHABLE_KEY` estão vazias.
- Em vez de deixar o `createClient` lançar erro síncrono e quebrar o React, renderiza uma tela de erro amigável: "Configuração indisponível. Recarregue a página ou contate o suporte."
- Loga o erro no console com contexto claro.

Isso evita tela branca futura mesmo se o pipeline da Lovable falhar de novo. **Não toco no comportamento normal** — só adiciono fallback para o cenário de envs ausentes.

### Passo 4 — Se o passo 1 não resolver
Se republicar não corrigir (envs continuam fora do bundle), é bug do pipeline da Lovable e precisa abrir suporte. Nesse caso, o passo 3 ainda protege seus usuários enquanto o suporte resolve.

## Arquivo alterado
- `src/integrations/supabase/client.ts` — guard contra envs vazias + tela de erro amigável renderizada no `#root` se falhar.

## O que você deve fazer agora
1. Clicar em **Publish → Update**.
2. Me avisar quando terminar — eu valido o bundle e confirmo se subiu correto.
3. Se quiser que eu já adicione o guard defensivo do passo 3 mesmo assim (recomendo), aprove este plano e eu implemento.

