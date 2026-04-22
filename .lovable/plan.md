

## Diagnóstico

A tela branca em `/dashboard` (preview e produção) **não tem erro de JS** — só um `<div className="min-h-screen bg-background" />` vazio do `Suspense fallback` do `App.tsx`. Isso é o sintoma clássico de **falha em carregar um chunk lazy**: o navegador pede um arquivo `Dashboard-[hash].js` que não existe mais (build nova invalidou o hash), o `import()` rejeita silenciosamente e o `Suspense` fica para sempre no fallback vazio.

Acontece tanto em preview quanto em produção porque:
- O usuário tem o `index.html` antigo em cache (referenciando hashes antigos)
- O servidor já serve a build nova (com hashes novos)
- Os chunks antigos retornam 404 → Suspense fica eternamente carregando.

## Correção

### 1) `src/App.tsx` — auto-recovery em chunk error
- Criar um helper `lazyWithRetry(import)` que envolve cada `lazy(() => import(...))`.
- Na primeira falha do `import()`:
  - Se a página ainda não foi recarregada (controle via `sessionStorage`), faz `window.location.reload()` automaticamente — pega o `index.html` novo e os hashes novos.
  - Se já recarregou, mostra fallback de erro com botão "Recarregar".
- Trocar todos os `lazy(() => import(...))` por `lazyWithRetry(() => import(...))`.
- Trocar o `Suspense fallback` (atualmente um div vazio) por um spinner real (Loader2 centralizado), assim mesmo em rede lenta o usuário vê algo, não tela branca.

### 2) `src/main.tsx` — listener global de chunk error
- Adicionar `window.addEventListener('error', ...)` e `window.addEventListener('unhandledrejection', ...)` que detectam mensagens típicas (`Failed to fetch dynamically imported module`, `Loading chunk`, `ChunkLoadError`) e disparam o mesmo recovery (reload único protegido por sessionStorage).
- Cobre o caso em que o erro acontece fora de um `Suspense` boundary.

### 3) `index.html` — desabilitar cache do HTML
- Adicionar `<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />`, `Pragma: no-cache`, `Expires: 0` no `<head>`.
- Garante que o `index.html` **nunca** seja servido do cache do navegador, então o usuário sempre baixa o HTML mais novo (que aponta para os hashes corretos dos chunks). Os assets JS/CSS continuam com cache normal por causa do hash no nome.

## Resultado esperado
- Quem está com tela branca agora: ao recarregar uma vez, o `index.html` novo carrega, os chunks novos resolvem, dashboard volta.
- Próximas vezes que houver deploy: o auto-retry recarrega sozinho na primeira falha de chunk, sem o usuário perceber.
- O `Suspense` mostra spinner em vez de tela branca enquanto baixa o chunk em conexões lentas.

## Arquivos alterados
- `src/App.tsx` — `lazyWithRetry` + Suspense fallback com spinner.
- `src/main.tsx` — listener global de chunk error.
- `index.html` — meta tags anti-cache do HTML.

