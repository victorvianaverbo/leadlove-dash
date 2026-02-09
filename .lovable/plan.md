

# Duas Formas de Conexao Meta Ads para Todos

## Problema atual

O componente MetaAdsIntegrationCard so mostra o formulario manual (Access Token + Ad Account ID) para integracoes legadas (`isManualLegacy`). Novas conexoes so veem o botao de OAuth, que depende da aprovacao do `ads_read` pela Meta.

## O que sera feito

Mostrar **ambas as opcoes** (OAuth e manual) para todos os usuarios, independente do estado da integracao:

1. **Botao "Conectar com Facebook"** (OAuth) - sempre visivel
2. **Formulario manual** (Access Token + Ad Account ID) - sempre visivel, com separador "ou conecte manualmente"

## Mudancas tecnicas

**Arquivo:** `src/components/integrations/MetaAdsIntegrationCard.tsx`

| Trecho atual | Mudanca |
|-------------|---------|
| Linha 326: `{(!isConnected \|\| isOAuthConnected) && (` | Mostrar OAuth sempre (remover condicao) |
| Linha 418: `{isManualLegacy && (` | Mostrar formulario manual sempre que nao conectado OU para legados, com label "ou conecte manualmente" |
| Formulario manual | Permitir tambem para novas conexoes (sem integracao existente) |

Fluxo resultante:

```text
+------------------------------------------+
|  Meta Ads                                |
|                                          |
|  [Conectar com Facebook]    (OAuth)      |
|                                          |
|  --------- ou ---------                 |
|                                          |
|  Access Token: [__________]  (manual)    |
|  Ad Account ID: act_[______]             |
|  [Salvar Meta Ads]                       |
|                                          |
|  Quando conectado:                       |
|  [Desconectar]                           |
|  + Seletor de campanhas                  |
+------------------------------------------+
```

Quando ja conectado (por qualquer metodo), mostra:
- Status de conectado + botao desconectar
- Se OAuth: seletor de conta + opcao de reconectar
- Se manual: formulario para atualizar token
- Campanhas em ambos os casos

