
Objetivo: corrigir o “login eterno” e o carregamento travado das páginas protegidas (dashboard, projeto, settings, admin), removendo a corrida entre restauração da sessão e consultas autenticadas.

1. Fortalecer a inicialização de autenticação em `src/contexts/AuthContext.tsx`
- Separar claramente:
  - `loading`: restauração inicial da autenticação
  - `session`: sessão realmente pronta para uso
  - novo estado derivado como `authReady` / `sessionReady`
- Inicializar primeiro com `supabase.auth.getSession()` e só liberar a app quando essa leitura terminar.
- Manter `onAuthStateChange` apenas para atualizar mudanças posteriores, sem depender dele para concluir a inicialização.
- Evitar estados transitórios que limpam o usuário cedo demais e causam redirecionamento falso.
- Garantir que `checkSubscription()` só rode quando houver sessão válida pronta, sem bloquear a navegação principal.

2. Parar de usar checagens frágeis de sessão dentro das queries
- Em `src/pages/Dashboard.tsx`, remover a lógica que chama `supabase.auth.getSession()` dentro do `queryFn` e dispara “Session expired”.
- Fazer as queries dependerem de `authReady && !!user && !!session` em vez de depender só de `!!user`.
- Aplicar o mesmo padrão nas páginas protegidas que hoje consultam dados cedo demais:
  - `src/pages/ProjectNew.tsx`
  - `src/pages/ProjectView.tsx`
  - `src/pages/ProjectEdit.tsx`
  - `src/pages/Settings.tsx`
  - `src/pages/Admin.tsx`
  - `src/pages/AdminProjects.tsx`

3. Ajustar os redirecionamentos para acontecerem só quando a autenticação estiver realmente pronta
- Hoje várias páginas fazem `if (!loading && !user) navigate('/auth')`; isso pode acontecer antes da sessão estar estável.
- Trocar esse padrão para redirecionar apenas quando a restauração inicial já terminou de verdade.
- No `src/pages/Auth.tsx`, manter o redirecionamento ao dashboard após login, mas só quando a sessão estiver pronta, evitando cair numa rota protegida cedo demais.

4. Desacoplar carregamento de assinatura do carregamento da página
- `subscriptionLoading` não deve travar tela inteira nas páginas em que a assinatura não é necessária para montar o layout base.
- No dashboard, renderizar estrutura normal e carregar status do plano em paralelo.
- Em páginas onde assinatura afeta permissão (como `ProjectNew`), mostrar estado intermediário só para a área dependente da assinatura, sem parecer que a app inteira travou.
- No `/auth`, impedir que o fluxo de checkout segure a navegação quando não houver `plan` na URL.

5. Padronizar um guard reutilizável para páginas privadas
- Criar um pequeno hook ou helper de proteção (ex.: `useRequireAuth` ou `useAuthReady`) para centralizar:
  - espera da sessão inicial
  - decisão de redirecionar
  - condição correta para habilitar queries
- Isso reduz divergência entre páginas e evita que o bug reapareça.

6. Validar o fluxo completo após a correção
- Testar cenários:
  - abrir `/dashboard` com sessão já salva
  - login normal em `/auth`
  - refresh em rota protegida (`/dashboard`, `/projects/:id`, `/settings`)
  - logout e retorno para `/auth`
  - rota com plano (`/auth?plan=starter`) sem travar a tela
- Confirmar que:
  - não há loader infinito
  - não há redirecionamento em loop
  - queries só começam após a sessão ficar pronta
  - páginas protegidas carregam normalmente após refresh

Arquivos principais a ajustar
- `src/contexts/AuthContext.tsx`
- `src/pages/Auth.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/ProjectNew.tsx`
- `src/pages/ProjectView.tsx`
- `src/pages/ProjectEdit.tsx`
- `src/pages/Settings.tsx`
- `src/pages/Admin.tsx`
- `src/pages/AdminProjects.tsx`

Detalhe técnico
- O problema mais provável é uma corrida de autenticação: a UI considera o usuário “logado” ou “deslogado” antes de a sessão/token estar totalmente restaurada no cliente. Com isso, algumas páginas redirecionam cedo demais e outras tentam consultar dados protegidos sem a sessão pronta, o que gera tela de loading eterna, falha silenciosa de query ou volta para `/auth`.
