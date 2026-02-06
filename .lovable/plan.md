

## Corrigir OAuth do Facebook - Meta Ads

### Problema
A edge function `meta-oauth-callback` esta recebendo chamadas GET sem os parametros `code` e `state` do Facebook. Isso indica que o `redirect_uri` usado na chamada OAuth nao corresponde exatamente ao configurado no Meta App, ou o Facebook esta rejeitando a autorizacao.

### Causas identificadas

1. **redirect_uri inconsistente**: O frontend monta o redirect_uri usando `VITE_SUPABASE_URL`, mas a URL pode ter diferenca de formato (barra final, protocolo) comparado ao que foi cadastrado no Meta App
2. **Redirect de volta hardcoded**: A funcao redireciona para `metrikapro.com.br` apos sucesso, mas durante testes no Lovable preview isso nao funciona
3. **Popup pode estar sendo bloqueado**: `window.open` com popup pode ser bloqueado pelo navegador

### Solucao

**1. Edge Function (`meta-oauth-callback/index.ts`)**
- Adicionar log do redirect_uri usado, para diagnostico
- Usar a URL de origem (origin) passada no state para redirecionar de volta, em vez de URL hardcoded
- Mudar o formato do state para: `projectId|userId|originUrl`

**2. Frontend (`MetaAdsIntegrationCard.tsx`)**
- Incluir `window.location.origin` no state para que o redirect volte para o ambiente correto (preview ou producao)
- Garantir que o redirect_uri seja construido de forma consistente

**3. Verificacao de redirect_uri**
- A URI cadastrada no Meta App deve ser EXATAMENTE: `https://ohwaygqxelyaytljbcsb.supabase.co/functions/v1/meta-oauth-callback`
- Sem barra no final
- O frontend deve usar essa mesma string

### Detalhes tecnicos

**Arquivos alterados:**

1. `supabase/functions/meta-oauth-callback/index.ts`
   - Log do redirect_uri para debug
   - Extrair origin do state (terceiro parametro)
   - Usar origin dinamico no `getAppRedirectUrl` em vez de `metrikapro.com.br` fixo

2. `src/components/integrations/MetaAdsIntegrationCard.tsx`
   - Mudar state para incluir origin: `${projectId}|${user.id}|${window.location.origin}`
   - Garantir redirect_uri consistente sem barra final

### Resultado esperado
- O Facebook redireciona corretamente com `code` e `state`
- A edge function troca o codigo por token e salva
- O usuario e redirecionado de volta para a pagina correta (funciona tanto no preview quanto em producao)
