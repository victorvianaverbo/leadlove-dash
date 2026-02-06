

## Criar Edge Function `eduzz-products`

### Problema
A integração Eduzz não funciona porque a edge function `eduzz-products` não existe. Quando o usuário conecta a Eduzz e tenta ver os produtos disponíveis, o sistema tenta chamar essa função e falha com erro 404.

A sincronização de vendas já tem o código Eduzz implementado em `sync-project-data`, mas falta a função que lista os produtos para o usuário selecionar quais quer monitorar.

### Solução

Criar a edge function `supabase/functions/eduzz-products/index.ts` seguindo o mesmo padrão das outras funções de produtos (kiwify-products, hotmart-products, guru-products):

1. Autenticar o usuário via JWT
2. Buscar credenciais da integração Eduzz no banco (campo `api_key`)
3. Chamar a API Eduzz para listar produtos: `https://api.eduzz.com/myeduzz/v1/products`
4. Retornar lista de produtos com `id` e `name`

### Arquivo a criar
- `supabase/functions/eduzz-products/index.ts`

### Arquivo a atualizar
- `supabase/config.toml` - adicionar entrada `[functions.eduzz-products]` com `verify_jwt = false`

### Detalhes técnicos

A função seguirá o mesmo padrão de autenticação das outras (kiwify-products como referência):
- Recebe `project_id` no body
- Valida que o usuário é dono do projeto
- Busca credenciais da integração tipo `eduzz`
- Chama `GET https://api.eduzz.com/myeduzz/v1/products` com header `Authorization: Bearer {api_key}`
- Retorna `{ products: [{ id, name }] }`

