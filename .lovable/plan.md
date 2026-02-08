

## Seletor de Conta de Anuncios para o Usuario

### Contexto
O App Meta pertence ao desenvolvedor, mas cada usuario final conecta sua propria conta de anuncios via Facebook Login. Apos o OAuth, a edge function ja salva todas as contas disponiveis do usuario em `credentials.available_ad_accounts`. Porem o frontend nao mostra essa lista -- seleciona automaticamente a primeira conta ativa.

### Solucao
Adicionar um dropdown no `MetaAdsIntegrationCard` que aparece apos conexao via OAuth, permitindo ao usuario escolher qual conta de anuncios usar.

### Detalhes tecnicos

**Arquivo: `src/components/integrations/MetaAdsIntegrationCard.tsx`**

1. Extrair `available_ad_accounts` e `oauth_connected` das credenciais no `useEffect` existente
2. Adicionar estado local para a lista de contas disponiveis e flag OAuth
3. Quando `oauth_connected === true` e existem contas disponiveis, mostrar um `Select` dropdown:
   - Cada opcao mostra o nome da conta e o ID
   - Contas inativas (account_status !== 1) marcadas com indicador visual
   - Conta atualmente selecionada pre-marcada
4. Ao trocar de conta, salvar o novo `ad_account_id` na integracao via Supabase update
5. Invalidar a query de campanhas para recarregar da nova conta
6. Esconder os campos manuais de Access Token e Ad Account ID quando conectado via OAuth (o usuario nao precisa deles)

**Fluxo do usuario:**

```text
Usuario clica "Conectar com Facebook"
  -> Autoriza no Facebook
  -> Redirect de volta com sucesso
  -> Card mostra status "Conectado" + dropdown de contas
  -> Usuario seleciona a conta de anuncios desejada
  -> Sistema salva e recarrega campanhas da conta selecionada
```

**Detalhes do dropdown:**
- Label: "Conta de Anuncios"
- Placeholder: "Selecione uma conta"
- Formato de cada opcao: "Nome da Conta (act_123456)"
- Contas com status diferente de 1 (ativa) mostram badge "Inativa"
- Salvamento automatico ao selecionar (com toast de confirmacao)

