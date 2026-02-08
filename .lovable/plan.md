

## Expandir OAuth Meta Ads para todos e atualizar UX + tutorial

### O que muda

1. **OAuth disponivel para todos os usuarios** - Remover a restricao `OAUTH_TEST_USER`. Todos verao o botao "Conectar com Facebook".
2. **Usuarios ja conectados via token manual nao sao afetados** - Quem ja tem integracao ativa com token continua usando normalmente. Porem, se desconectar, ao reconectar so vera a opcao OAuth (sem campos manuais).
3. **Mensagem clara apos conectar via OAuth** - Apos o popup de sucesso, exibir instrucao para o usuario selecionar a conta de anuncios no dropdown que aparece.
4. **Tutorial atualizado** - Substituir o tutorial antigo (Graph API Explorer + token manual) pelo novo fluxo OAuth simplificado.

### Detalhes tecnicos

**Arquivo: `src/components/integrations/MetaAdsIntegrationCard.tsx`**

- Remover `OAUTH_TEST_USER` e `isOAuthUser`. Todos os usuarios passam a ver o botao OAuth.
- Manter o formulario manual APENAS para integracoes ja existentes que nao sao OAuth (`!isOAuthConnected && isConnected`). Isso preserva quem ja esta conectado via token.
- Para novas conexoes (sem integracao ativa), exibir SOMENTE o botao OAuth.
- Apos conectar via OAuth com sucesso (no handler do `postMessage`), exibir toast com instrucao: "Meta Ads conectado! Selecione sua conta de anuncios abaixo."
- Adicionar um destaque visual (borda pulsante ou badge "Acao necessaria") no dropdown de conta de anuncios quando nenhuma conta esta selecionada apos OAuth, para guiar o usuario.
- Remover o `MetaAdsHelperBox` (tutorial do token manual) ja que nao e mais necessario para novos usuarios.

**Arquivo: `src/components/docs/MetaAdsTutorial.tsx`**

- Reescrever o tutorial completo para o novo fluxo OAuth:
  - Passo 1: Acessar o projeto no MetrikaPRO e clicar em Editar
  - Passo 2: Na secao Meta Ads, clicar em "Conectar com Facebook"
  - Passo 3: Autorizar as permissoes no popup do Facebook
  - Passo 4: Selecionar a conta de anuncios no dropdown
  - Passo 5: Selecionar as campanhas a monitorar
  - Passo 6: Salvar configuracoes
- Atualizar tempo estimado para "2-3 minutos"
- Remover secoes sobre Graph API Explorer, token manual, extensao de token, e Ad Account ID manual
- Manter secao de Solucao de Problemas adaptada ao novo fluxo
- Atualizar FAQ para refletir que nao ha mais token manual

### Logica de transicao

```text
Usuario abre Meta Ads no editor:
  |
  +-- Tem integracao ativa?
  |     |
  |     +-- E OAuth? -> Mostra dropdown de contas + campanhas
  |     |
  |     +-- E token manual? -> Mostra form manual normalmente (preserva)
  |           |
  |           +-- Se desconectar -> Ao reconectar, so ve OAuth
  |
  +-- Nao tem integracao ativa? -> Mostra SOMENTE botao OAuth
```

