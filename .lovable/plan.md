

# Preparacao para Venda em Escala - MetrikaPRO

## 1. Desabilitar botao OAuth do Facebook (Em Breve)

**Arquivo:** `src/components/integrations/MetaAdsIntegrationCard.tsx`

O botao "Conectar com Facebook" sera desabilitado com visual de "Em breve" enquanto o App Review nao for aprovado. O metodo manual (Token + Ad Account ID) continua funcionando normalmente.

Mudancas:
- Desabilitar o botao e adicionar badge "Em breve"
- Manter o texto explicativo mas indicar que OAuth estara disponivel em breve
- Manter o fluxo manual como metodo principal e visivel

---

## 2. Varredura de Problemas Criticos para Escala

Apos analise completa do codigo, banco de dados, seguranca e UX, aqui estao os problemas encontrados organizados por prioridade:

### CRITICOS (devem ser corrigidos antes de vender em escala)

| # | Problema | Impacto | Correcao |
|---|----------|---------|----------|
| 1 | **PII de clientes exposta no dashboard publico** | Emails e nomes de compradores ficam visiveis para qualquer pessoa com o link publico. Viola LGPD. | Remover `customer_email` e `customer_name` da view `sales_public` |
| 2 | **Sync publico sem autenticacao** | Qualquer pessoa pode disparar sincronizacoes para projetos publicos, gastando rate limits das APIs externas (Kiwify, Meta). | Adicionar rate limiting ou remover o botao de sync do dashboard publico |
| 3 | **OAuth state sem validacao** | O parametro state do OAuth do Meta nao eh validado criptograficamente, permitindo hijack. | Adicionar validacao de ownership (userId owns projectId) no callback |
| 4 | **Open redirect no OAuth callback** | A URL de redirecionamento vem do state sem validacao contra allowlist. | Validar originUrl contra lista de dominios permitidos |

### IMPORTANTES (corrigir logo apos lancamento)

| # | Problema | Impacto |
|---|----------|---------|
| 5 | **Google OAuth usa `supabase.auth.signInWithOAuth` direto** | Deveria usar `lovable.auth.signInWithOAuth` para funcionar corretamente com Lovable Cloud. Atualmente mostra o link tecnico feio que voce viu no print. |
| 6 | **Leaked Password Protection desabilitada** | Senhas comprometidas em vazamentos podem ser usadas para login. |
| 7 | **Dados de negocio expostos no dashboard publico** | `investment_value`, `kiwify_ticket_price`, campaign IDs ficam visiveis para concorrentes. |

### FUNCIONALIDADES OK PARA ESCALA

- Fluxo de signup/login (email + Google) - funcional
- Checkout com Stripe (trial 7 dias + 4 planos) - funcional
- Integracao Kiwify/Hotmart/Guru/Eduzz - funcional
- Integracao Meta Ads manual (token) - funcional
- Dashboard com metricas (ROAS, CPA, vendas) - funcional
- Dashboard publico compartilhavel - funcional (com ressalvas de seguranca acima)
- Relatorios com IA - funcional
- Painel admin - funcional
- Sistema de projetos com limites por plano - funcional
- Pagina de pricing - funcional
- Onboarding tour - funcional

---

## Plano de Implementacao

### Fase 1 (esta sessao)
1. Desabilitar botao OAuth do Facebook com badge "Em breve"
2. Corrigir PII na view `sales_public` (remover email/nome do comprador)
3. Adicionar allowlist de dominios no OAuth callback
4. Adicionar validacao de ownership no OAuth state

### Fase 2 (proxima sessao)
5. Migrar Google OAuth para `lovable.auth.signInWithOAuth`
6. Adicionar rate limiting ou remover sync do dashboard publico
7. Restringir dados de negocio no dashboard publico

---

## Detalhes Tecnicos

### Arquivos modificados na Fase 1:

| Arquivo | Mudanca |
|---------|---------|
| `src/components/integrations/MetaAdsIntegrationCard.tsx` | Desabilitar botao OAuth, adicionar badge "Em breve" |
| `supabase/functions/meta-oauth-callback/index.ts` | Allowlist de dominios + validacao de ownership |
| Migration SQL | Atualizar view `sales_public` removendo PII |

