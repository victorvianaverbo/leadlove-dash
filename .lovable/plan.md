

## Facebook Login OAuth para Meta Ads (usuario isolado)

### Resumo
Implementar conexao direta com Facebook Login (OAuth popup) para a integracao Meta Ads. O novo fluxo sera ativado **apenas para o usuario `ee3515c2-...`** como teste. Todos os outros usuarios continuam usando o metodo manual (token + ad account ID).

### Como vai funcionar

1. O usuario clica em "Conectar com Facebook"
2. Um popup abre pedindo permissao (ads_read, ads_management, read_insights)
3. O Facebook retorna um codigo de autorizacao
4. Uma Edge Function troca esse codigo por um token de longa duracao (60 dias)
5. A funcao tambem busca as Ad Accounts disponiveis automaticamente
6. O token e o ad_account_id sao salvos na tabela `integrations` (mesmo formato atual)

O restante do sistema (sync-project-data, meta-campaigns) continua funcionando sem alteracao, pois o formato dos dados salvos e identico.

### Configuracao do Meta App (o que voce precisa fazer)

No painel do Meta App (developers.facebook.com):

1. **Adicionar produto "Facebook Login for Business"** (ou "Facebook Login")
2. Em **Settings > Basic**: confirmar que Privacy Policy URL e Terms URL estao preenchidos (metrikapro.com.br/privacy e /terms)
3. Em **Facebook Login > Settings**:
   - Habilitar "Client OAuth Login" = Sim
   - Habilitar "Web OAuth Login" = Sim
   - Em "Valid OAuth Redirect URIs", adicionar:
     - `https://ohwaygqxelyaytljbcsb.supabase.co/functions/v1/meta-oauth-callback`
   - Em "Allowed Domains for the JavaScript SDK", adicionar:
     - `lovable.app`
     - `metrikapro.com.br`
4. Em **App Review > Permissions**: solicitar `ads_read`, `ads_management` e `read_insights`
5. Copiar o **App ID** e o **App Secret** para fornecer quando eu pedir

### Detalhes tecnicos

**Secrets necessarios:**
- `META_APP_ID` - ID do App Meta
- `META_APP_SECRET` - Secret do App Meta

**Arquivos novos:**
- `supabase/functions/meta-oauth-callback/index.ts` - Edge Function que recebe o codigo do Facebook, troca por token de longa duracao, busca ad accounts, e salva na tabela integrations

**Arquivos alterados:**
- `src/components/integrations/MetaAdsIntegrationCard.tsx` - Adicionar botao "Conectar com Facebook" que aparece apenas para o usuario teste. O fluxo manual permanece intacto para todos os outros
- `supabase/config.toml` - Registrar a nova funcao meta-oauth-callback

**Logica de isolamento no frontend:**
```text
if (user.id === "ee3515c2-6a17-40b1-971f-34a788b7d2ec") {
  // Mostrar botao "Conectar com Facebook" (OAuth)
} else {
  // Mostrar formulario manual (token + ad account ID) - sem mudancas
}
```

**Fluxo OAuth (Edge Function):**
1. Recebe `code` e `project_id` via query params (redirect do Facebook)
2. Troca code por short-lived token via `graph.facebook.com/v18.0/oauth/access_token`
3. Troca short-lived por long-lived token via `graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token`
4. Busca ad accounts do usuario via `graph.facebook.com/v18.0/me/adaccounts`
5. Salva/atualiza na tabela `integrations` com as mesmas colunas
6. Redireciona o usuario de volta para a pagina de edicao do projeto

**Nenhuma alteracao em:**
- `sync-project-data` (usa o mesmo formato de credentials)
- `meta-campaigns` (usa o mesmo formato de credentials)
- Fluxo de outros usuarios

### Proximo passo
Apos aprovacao, vou pedir os secrets META_APP_ID e META_APP_SECRET antes de implementar o codigo.

