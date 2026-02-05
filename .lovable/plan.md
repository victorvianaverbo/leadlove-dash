
# Plano: Corrigir Integração Eduzz + Melhorias de Escalabilidade

## Fase 1: Corrigir Eduzz (Prioridade Máxima)

### Problema Atual
O código da Eduzz **não foi adicionado ao frontend**:
- `SalesIntegrationCard.tsx` não tem `eduzz` no tipo nem config
- `ProjectEdit.tsx` não renderiza o card de Eduzz

### Credenciais da Eduzz
A API Eduzz usa **apenas 1 chave para autenticação server-side**:
- **API Key** - Token Bearer para `/myeduzz/v1/products` e `/myeduzz/v1/sales`

Public Key e Origin Key são para validações client-side e webhooks - não precisamos delas para sincronização.

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `SalesIntegrationCard.tsx` | Adicionar `'eduzz'` ao tipo e config com campo `api_key` |
| `ProjectEdit.tsx` | Adicionar state `eduzzProducts` + card Eduzz + salvar `eduzz_product_ids` |

---

## Fase 2: Melhorias de Alta Prioridade (Próximas)

Baseado no documento de análise, concordo com as recomendações. Após corrigir Eduzz:

| # | Ação | Esforço |
|---|------|---------|
| 1 | Criar índice parcial `idx_sales_paid_project_date WHERE status = 'paid'` | 5 min |
| 2 | Renomear `kiwify_sale_id` → `external_sale_id` | 30 min |
| 3 | Adicionar índices GIN para arrays de product_ids | 10 min |

---

## Fase 3: Melhorias de Média Prioridade

| # | Ação | Esforço |
|---|------|---------|
| 4 | Otimizar queries N+1 do Dashboard | 4h |
| 5 | Error Boundaries granulares | 2h |
| 6 | Rate limiting por usuário | 1 dia |

---

## Fase 4: Escalabilidade Futura

| # | Ação | Quando |
|---|------|--------|
| 7 | Sistema de filas (pg_notify ou BullMQ) | > 500 usuários |
| 8 | Particionamento de tabelas | > 1M registros |
| 9 | Servidor dedicado (Railway/Fly.io) | > 1000 usuários |

---

## Implementação Imediata (Fase 1)

### 1. SalesIntegrationCard.tsx

```typescript
type IntegrationType = 'kiwify' | 'hotmart' | 'guru' | 'eduzz';

const integrationConfig = {
  // ... existing ...
  eduzz: {
    name: 'Eduzz',
    description: 'Conecte a conta Eduzz para importar vendas',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', sensitive: true },
    ],
    productsEndpoint: 'eduzz-products',
  },
};
```

### 2. ProjectEdit.tsx

Adicionar:
- State: `const [eduzzProducts, setEduzzProducts] = useState<string[]>([]);`
- Buscar integração: `const eduzzIntegration = integrations?.find(i => i.type === 'eduzz');`
- Carregar do projeto: `setEduzzProducts((project as any).eduzz_product_ids || []);`
- Renderizar card após Guru
- Salvar no update: `eduzz_product_ids: eduzzProducts`

---

## Resumo

Vamos implementar em fases:
1. **Agora**: Corrigir frontend do Eduzz (já temos backend pronto)
2. **Depois**: Aplicar melhorias de índices/renomeação
3. **Futuro**: Otimizações de arquitetura para escala
