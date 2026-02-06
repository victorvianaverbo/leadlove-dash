

## Renomear "Client Secret" para "Access Token" na integracao Eduzz

### Problema
O Console Eduzz mostra dois botoes: **"Copiar Client ID"** e **"Copiar Access Token"**. O formulario do MetrikaPRO pede "Client Secret", que nao existe no Console -- causando confusao.

### O que muda
Apenas o **label visivel** do segundo campo. O `key` interno (`client_secret`) permanece igual para compatibilidade com credenciais ja salvas e com as edge functions.

### Alteracoes

**1. `src/components/integrations/SalesIntegrationCard.tsx`** (linha 70)
- Renomear label de `"Client Secret"` para `"Access Token"`

**2. `supabase/functions/eduzz-products/index.ts`** (linha 115)
- Atualizar mensagem de erro 401 para mencionar "Access Token" ao inves de "Token Pessoal"

**3. `src/components/docs/EduzzTutorial.tsx`**
- Atualizar instrucoes para dizer "Access Token" ao inves de "Client Secret"

### O que voce precisa fazer
No Console Eduzz (console.eduzz.com):
1. Abra seu aplicativo
2. Copie o **Client ID** e cole no primeiro campo
3. Copie o **Access Token** e cole no segundo campo

### Detalhes tecnicos
- O `key: 'client_secret'` continua igual no banco de dados para nao quebrar credenciais existentes
- A edge function ja usa esse valor como Bearer token (`Bearer ${bearerToken}`), entao o Access Token funciona direto
- Compatibilidade mantida com formatos antigos: `creds.client_secret || creds.api_key`

