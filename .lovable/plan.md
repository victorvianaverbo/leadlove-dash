

## Correção: Contagem de Projetos sem Filtro de Usuário

### Problema
Na página de criar projeto (`ProjectNew.tsx`), a query que conta quantos projetos o usuário tem **não filtra por usuário**. Isso faz com que ela conte todos os projetos da plataforma inteira, mostrando "10 de 1" para o Victor quando deveria mostrar "0 de 1".

### O que será alterado

**`src/pages/ProjectNew.tsx`** (2 mudanças pequenas):

1. Adicionar `.eq('user_id', user!.id)` na query de contagem de projetos (linha 49)
2. Incluir `user?.id` na `queryKey` para que o cache seja por usuário: `['project-count', user?.id]`

### Resultado
- Victor (e todos os outros usuários) verão a contagem correta dos **seus** projetos
- O limite do plano será respeitado individualmente por conta

### Verificação
As demais queries de projetos no Dashboard, ProjectView e ProjectEdit já filtram corretamente por `user_id` ou por slug/UUID com RLS -- não precisam de ajuste.

