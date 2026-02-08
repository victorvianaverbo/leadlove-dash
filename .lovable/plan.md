

## Corrigir Seletor de Conta de Anuncios nao aparecendo

### Diagnostico
Os dados estao corretos no banco: `oauth_connected: true` e `available_ad_accounts` com 25 contas. O codigo do dropdown tambem esta correto na condicao `isConnected && isOAuthConnected && availableAdAccounts.length > 0`.

O problema tem dois aspectos:

1. **Apos reconectar via OAuth**, a pagina pode nao estar recarregando os dados da integracao corretamente. O `useEffect` depende de `integration?.credentials`, mas se a query estiver cacheada, os novos dados (com `oauth_connected` e `available_ad_accounts`) nao sao refletidos.

2. **Falta botao de "Reconectar"** quando ja conectado. O botao do Facebook so aparece quando `!isConnected`, entao apos conexao, o usuario nao tem como reconectar sem desconectar primeiro.

3. **O collapsible pode estar fechado** por padrao apos redirect, escondendo o dropdown.

### Correcoes

**Arquivo: `src/components/integrations/MetaAdsIntegrationCard.tsx`**

1. Adicionar botao "Reconectar com Facebook" visivel mesmo quando ja conectado (para usuarios OAuth), ao lado do botao "Desconectar"

2. Garantir que apos o redirect OAuth (`meta_oauth=success`), o collapsible abra automaticamente e a query de integracoes seja invalidada com `refetchType: 'all'` para forcar recarregamento

3. Forcar o collapsible a abrir quando `isOAuthConnected && availableAdAccounts.length > 0` para o usuario ver o dropdown imediatamente

### Detalhes tecnicos

**Mudanca 1 - Botao de reconectar quando ja conectado (OAuth):**
No bloco de "Connection Status" (quando `isConnected`), adicionar o botao do Facebook para reconectar ao lado de "Desconectar", somente para o usuario OAuth.

**Mudanca 2 - Auto-abrir collapsible apos OAuth redirect:**
No `useEffect` que trata o redirect (linhas 81-100), chamar `onOpenChange(true)` apos sucesso para garantir que o card fica aberto e o dropdown visivel.

**Mudanca 3 - Invalidacao forcada:**
Trocar `invalidateQueries` por `refetchQueries` no handler do OAuth redirect para garantir dados frescos.

