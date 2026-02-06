

## Corrigir campo de credencial Eduzz: "API Key" para "Token Pessoal"

### Problema
Quando o usuario cria um app no Console Eduzz, ele recebe um **Client ID** e um **Token Pessoal**. Porem, o formulario do MetrikaPRO mostra apenas um campo chamado "API Key", o que confunde o usuario -- ele nao sabe qual dos dois colar.

### Solucao
Renomear o campo no formulario de "API Key" para **"Token Pessoal"** e adicionar um placeholder explicativo. Nao e necessario adicionar o campo Client ID, pois a edge function usa apenas o token Bearer.

### Alteracao

**Arquivo: `src/components/integrations/SalesIntegrationCard.tsx`** (linhas 65-72)

Alterar a configuracao do Eduzz de:
```
fields: [
  { key: 'api_key', label: 'API Key', type: 'password', sensitive: true },
],
```

Para:
```
fields: [
  { key: 'api_key', label: 'Token Pessoal (Console Eduzz)', type: 'password', sensitive: true },
],
```

O `key` permanece `api_key` para manter compatibilidade com credenciais ja salvas e com a edge function. Apenas o `label` visivel ao usuario muda.

### Resultado
O usuario vera "Token Pessoal (Console Eduzz)" no formulario, deixando claro que deve colar o token gerado no Console -- nao o Client ID.
