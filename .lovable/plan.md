

## Corrigir Produtos Kiwify nao Aparecendo

### Problema
A funcao `kiwify-products` nao esta deployada no servidor (retorna erro 404). Por isso, quando o usuario abre a pagina de edicao do projeto e expande a integracao Kiwify, a lista de produtos nao carrega.

### Evidencia
As requisicoes POST para `kiwify-products` retornam "Failed to fetch" nos logs de rede, e um teste direto confirmou o erro 404.

### Solucao
Fazer o deploy da funcao `kiwify-products`. O codigo ja existe e esta correto em `supabase/functions/kiwify-products/index.ts`. Nenhuma alteracao de codigo e necessaria - apenas o deploy.

### Detalhes tecnicos
- **Funcao:** `supabase/functions/kiwify-products/index.ts`
- **Acao:** Deploy da funcao existente
- **Nenhuma alteracao de codigo necessaria**

### Resultado
Apos o deploy, a lista de produtos Kiwify voltara a aparecer na pagina de edicao do projeto, permitindo selecionar quais produtos monitorar.
