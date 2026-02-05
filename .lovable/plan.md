
# Plano: Corrigir Erro de Constraint em Integrações Desativadas

## Diagnóstico

O erro **"duplicate key value violates unique constraint 'integrations_project_type_unique'"** ocorre no componente `MetaAdsIntegrationCard.tsx`.

### Causa Raiz

No `MetaAdsIntegrationCard.tsx` (linha 80), a lógica de save usa:

```typescript
if (integration?.is_active) {
  // UPDATE - só entra aqui se is_active === true
} else {
  // INSERT - entra aqui quando is_active === false
}
```

Quando o cliente Charles **desconecta** o Meta Ads:
1. A integração é marcada como `is_active: false`
2. Ao tentar **reconectar**, o código verifica `integration?.is_active` que é `false`
3. Entra no bloco `else` e tenta fazer INSERT
4. O INSERT falha porque já existe registro com `(project_id, type)`

### Comparação

| Componente | Condição | Comportamento |
|------------|----------|---------------|
| `SalesIntegrationCard` | `if (integration)` | Correto - UPDATE se existe |
| `MetaAdsIntegrationCard` | `if (integration?.is_active)` | Errado - INSERT se desativado |

---

## Solução

### Arquivo: `src/components/integrations/MetaAdsIntegrationCard.tsx`

Alterar a condição na linha 80 de:
```typescript
if (integration?.is_active) {
```

Para:
```typescript
if (integration) {
```

Isso garante que:
- Se a integração existe (ativa ou não) → faz UPDATE
- Se não existe → faz INSERT

### Ajustes Adicionais

A validação de campos também precisa ser ajustada para reconectar integrações desativadas:

```typescript
// ANTES (linha 98-101)
} else {
  if (!accessToken || !adAccountId) {
    throw new Error("Preencha todas as credenciais");
  }
  
// DEPOIS - validar sempre que não tiver integração OU integração desativada
} else {
  if (!accessToken || (!adAccountId && !integration)) {
    throw new Error("Preencha todas as credenciais");
  }
```

---

## Impacto

- Corrige o erro do cliente Charles
- Permite reconectar integrações que foram desconectadas
- Mantém compatibilidade com fluxo de primeira conexão

---

## Resumo Técnico

| Mudança | Linha | De | Para |
|---------|-------|----|----|
| Condição principal | 80 | `integration?.is_active` | `integration` |
| Validação adAccountId | 99 | `!adAccountId` | `!adAccountId && !integration` |
| Bloco UPDATE | 87-97 | Credenciais existentes se is_active | Credenciais existentes se integration |
