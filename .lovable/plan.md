

## Corrigir integração Eduzz: Token OAuth2 do Console

### Problema
A API da Eduzz mudou. O endpoint `myeduzz/v1/products` **nao aceita** a API Key do Orbita (painel antigo). Ele exige um **access token OAuth2** gerado pelo **Console Eduzz** (`console.eduzz.com`) com o escopo `myeduzz_products_read`.

Todos os logs mostram `401 invalid_token` porque o token armazenado e uma API Key do Orbita, que nao tem permissao para os endpoints `myeduzz/v1/*`.

### Causa raiz
- A documentacao do MetrikaPRO orienta o usuario a usar a "API Key do Orbita"
- Porem, os endpoints `myeduzz/v1/*` so aceitam tokens OAuth2 do Console Eduzz
- O Token Pessoal do Console (que nao expira) e a forma mais simples de resolver

### Solucao

**1. Atualizar a edge function `eduzz-products`**
- Adicionar log do inicio do token para debug (primeiros 10 chars)
- Melhorar mensagem de erro quando recebe 401 para orientar o usuario
- Manter compatibilidade: o formato `Bearer {token}` esta correto, o problema e o token em si

**2. Atualizar o tutorial da Eduzz (`EduzzTutorial.tsx`)**
- Remover o Metodo 1 (API Key do Orbita) como recomendado, pois nao funciona para endpoints myeduzz/v1
- Promover o **Token Pessoal do Console** como metodo principal:
  1. Acessar `console.eduzz.com`
  2. Ir em "Meus Aplicativos"
  3. Criar aplicativo com escopo `myeduzz_products_read` e `myeduzz_sales_read`
  4. Clicar em "Copiar access token" (Token Pessoal)
  5. Colar no MetrikaPRO
- Manter o Metodo OAuth2 completo como alternativa avancada

**3. Melhorar feedback na UI**
- Quando a API retorna 401, mostrar mensagem clara: "Token invalido. Use o Token Pessoal do Console Eduzz (console.eduzz.com)"

### Arquivos a alterar
- `supabase/functions/eduzz-products/index.ts` - melhorar logs e mensagem de erro 401
- `src/components/docs/EduzzTutorial.tsx` - corrigir tutorial para usar Token Pessoal do Console

### Detalhes tecnicos

**Formato correto do token Eduzz (Console):**
```
Authorization: Bearer qzrUZcm4dISz/ayXgq7g9+GmusYbXHmIpJ7fbLYDIjUPtNwAN1rrsRZbeJ6e6tAlSUSy3w==
```

**Escopos necessarios no aplicativo do Console:**
- `myeduzz_products_read` - para listar produtos
- `myeduzz_sales_read` - para sincronizar vendas

**Resposta esperada da API (sucesso):**
```json
{
  "pages": 1,
  "page": 1,
  "itemsPerPage": 25,
  "totalItems": 3,
  "items": [
    { "id": "abc123", "name": "Curso X", "status": "active" }
  ]
}
```

Note que o array de produtos esta em `items` (nao em `data` ou `products`). A edge function ja trata isso na linha 111, mas `items` deve ser priorizado.

