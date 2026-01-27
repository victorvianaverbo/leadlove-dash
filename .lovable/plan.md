
# Diagnóstico: Dados não carregando para Medsimple

## Resumo da Investigação

Investiguei o projeto **Medsimple** (ID: `4af70f92-4cdc-4a83-b08b-574e14ba97ce`) do cliente `contato@vianamidias.com.br`:

### O que está funcionando:
- Meta Ads: **125 registros** de ad_spend salvos (R$3.778,91 total)
- Produtos carregados: Hotmart (36), Guru (18), Meta Ads (95 campanhas)
- Credenciais configuradas corretamente para todas as integrações

### O que NÃO está funcionando:
- **0 vendas sincronizadas** de Hotmart e Guru
- Logs de Hotmart/Guru não aparecem (cobertos pelos 95+ logs de campanhas Meta)

## Causa Raiz Identificada

### Problema 1: Limite de logs oculta erros
O sistema de logs tem limite de 100 entradas. Como o cliente selecionou **95 campanhas Meta Ads**, os logs dessas campanhas estão ocupando todo o espaço, ocultando possíveis erros de Hotmart/Guru.

### Problema 2: Possível erro silencioso nas APIs de vendas
Os logs mostram que a sincronização rodou mas terminou com "0 sales". Não há registro de:
- "Starting Hotmart sync..."
- "Starting Guru DMG sync..."
- Nenhum erro de autenticação

Isso sugere que ou:
1. A obtenção do token OAuth falhou silenciosamente
2. A API retornou 0 vendas no período
3. Houve timeout na requisição

## Plano de Correção

### Fase 1: Melhorar Logging e Diagnóstico

Adicionar logs mais robustos no início de cada sincronização para garantir visibilidade:

**Arquivo:** `supabase/functions/sync-project-data/index.ts`

```text
Linha ~145: Adicionar log inicial
  console.log(`=== SYNC START: Project ${project_id} ===`);
  console.log(`Integrations found: Kiwify=${!!kiwifyIntegration}, Hotmart=${!!hotmartIntegration}, Guru=${!!guruIntegration}, Meta=${!!metaIntegration}`);
  console.log(`Products configured: Hotmart=${project.hotmart_product_ids?.length || 0}, Guru=${project.guru_product_ids?.length || 0}`);
```

### Fase 2: Tratar Erros de Autenticação OAuth

Melhorar tratamento de erros na obtenção de tokens:

**Hotmart (linhas 328-340):**
- Adicionar try-catch ao redor da requisição de token
- Logar status HTTP específico
- Retornar erro detalhado caso falhe

**Guru (linhas 434-444):**
- Adicionar log de tentativa de requisição
- Verificar se o endpoint v2 está respondendo corretamente
- Tratar erro 401/403 especificamente

### Fase 3: Verificar Endpoints da API

Pesquisei a documentação oficial:

1. **Hotmart API de Vendas:**
   - Endpoint atual: `https://developers.hotmart.com/payments/api/v1/sales/history`
   - Parâmetros: `product_id`, `start_date` (timestamp ms), `end_date` (timestamp ms)
   - Este endpoint está correto conforme documentação

2. **Guru API v2:**
   - Já corrigido de `api.digitalmanager.guru/api/v1` para `digitalmanager.guru/api/v2`
   - Verificar se o endpoint de transações está correto: `/api/v2/transactions`

### Fase 4: Implementar Retry e Fallback

Para evitar falhas silenciosas:

1. Adicionar retry em caso de timeout (3 tentativas)
2. Logar resposta completa em caso de erro
3. Continuar sincronização mesmo se uma integração falhar

## Código a Modificar

### `supabase/functions/sync-project-data/index.ts`

Adicionar os seguintes logs e tratamentos de erro nas seções:

- **Linhas 140-147**: Log de início com resumo das integrações
- **Linhas 326-340**: Melhorar log de autenticação Hotmart
- **Linhas 342-350**: Log detalhado de erro de token
- **Linhas 366-414**: Log de cada página de vendas e erros
- **Linhas 421-450**: Mesmas melhorias para Guru

## Ação Imediata para o Cliente

Enquanto implementamos as correções:

1. O cliente pode tentar **sincronizar novamente** clicando no botão "Atualizar"
2. Se continuar sem dados, pode ser que realmente não haja vendas no período (últimos 90 dias) para os produtos selecionados
3. Verificar se os produtos selecionados no Hotmart/Guru são os corretos (produtos ativos com vendas recentes)

## Estimativa de Implementação

| Tarefa | Tempo |
|--------|-------|
| Melhorar logging | 20 min |
| Tratamento de erros OAuth | 25 min |
| Verificar endpoints API | 15 min |
| Implementar retry | 20 min |
| Teste e deploy | 10 min |
| **Total** | **~1h30** |
