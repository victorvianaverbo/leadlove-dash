
# Implementar Integração Eduzz

## Visão Geral

Adicionar Eduzz como 4ª plataforma de checkout, seguindo o padrão já estabelecido para Kiwify, Hotmart e Guru.

---

## Componentes a Implementar

| Componente | Descrição |
|------------|-----------|
| Edge Function `eduzz-products` | Buscar produtos da conta Eduzz |
| Atualização `sync-project-data` | Sincronizar vendas da Eduzz |
| UI ProjectEdit | Adicionar card de integração Eduzz |
| UI ProjectView | Garantir label dinâmico para "Eduzz" |
| Banco de dados | Adicionar `eduzz_product_ids` na tabela `projects` |

---

## API Eduzz (Developer Hub)

### Autenticação
```
Header: Authorization: Bearer {API_KEY}
```

A API Key é obtida no painel Órbita: **Avançado → Configurações da API**

### Endpoints Utilizados

| Endpoint | Método | Escopo |
|----------|--------|--------|
| `https://api.eduzz.com/myeduzz/v1/products` | GET | Listar produtos |
| `https://api.eduzz.com/myeduzz/v1/sales` | GET | Listar vendas |

### Parâmetros de Vendas
```
?page=1
&itemsPerPage=100
&startDate=2024-01-01
&endDate=2025-02-05
&productId=123456
&status=paid
```

### Estrutura de Resposta (Sales)
```json
{
  "items": [{
    "id": "sale_id",
    "status": "paid",
    "grossGain": { "value": 197.00 },
    "netGain": { "value": 177.30 },
    "total": { "value": 197.00 },
    "paidAt": "2024-05-10T14:00:00Z",
    "createdAt": "2024-05-10T12:00:00Z",
    "payment": { "method": "creditCard" },
    "product": { "id": "123", "name": "Curso X" },
    "buyer": { "name": "João", "email": "joao@email.com" },
    "tracker": "facebook_cpc",
    "tracker2": "campanha_maio"
  }]
}
```

---

## Normalização de Status

| Eduzz | Interno |
|-------|---------|
| paid | paid |
| refunded, waitingRefund | refunded |
| canceled, expired, duplicated | canceled |
| open, processing, waitingPayment, recovering | pending |

---

## Arquivos a Criar/Modificar

### 1. Nova Edge Function: `supabase/functions/eduzz-products/index.ts`

Estrutura idêntica ao `guru-products`:
- Autenticação via Bearer token do usuário
- Valida project_id e ownership
- Busca credenciais (api_key) da tabela integrations
- Chama `https://api.eduzz.com/myeduzz/v1/products`
- Retorna lista formatada

### 2. Atualizar `supabase/functions/sync-project-data/index.ts`

Adicionar função `syncEduzz()`:
```typescript
async function syncEduzz(
  credentials: { api_key: string },
  productIds: string[],
  projectId: string,
  userId: string,
  syncStartDate: Date
): Promise<SyncResult>
```

**Lógica de sincronização:**
- Endpoint: `https://api.eduzz.com/myeduzz/v1/sales`
- Paginação: `page` + `itemsPerPage=100`
- Filtros: `startDate`, `endDate`, `productId`
- Valores: `netGain.value` (líquido) e `total.value` (bruto)
- Datas: `paidAt` ou `createdAt`
- UTMs: `tracker`, `tracker2`, `tracker3`

Adicionar normalização de status para Eduzz:
```typescript
if (source === 'eduzz') {
  if (statusLower === 'paid') return 'paid';
  if (statusLower === 'refunded' || statusLower === 'waitingrefund') return 'refunded';
  if (statusLower === 'canceled' || statusLower === 'expired' || statusLower === 'duplicated') return 'canceled';
  if (['open', 'processing', 'waitingpayment', 'recovering', 'scheduled', 'negotiated'].includes(statusLower)) return 'pending';
}
```

Integrar no fluxo principal (onde Kiwify/Hotmart/Guru são chamados).

### 3. Atualizar `supabase/config.toml`

```toml
[functions.eduzz-products]
verify_jwt = false
```

### 4. Atualizar `src/components/integrations/SalesIntegrationCard.tsx`

Adicionar configuração Eduzz no `integrationConfig`:
```typescript
eduzz: {
  name: 'Eduzz',
  description: 'Conecte a conta Eduzz para importar vendas',
  fields: [
    { key: 'api_key', label: 'API Key', type: 'password', sensitive: true },
  ],
  productsEndpoint: 'eduzz-products',
}
```

Adicionar tipo `'eduzz'` ao `IntegrationType`.

### 5. Atualizar `src/pages/ProjectEdit.tsx`

- Adicionar state `eduzzProducts`
- Buscar integração Eduzz
- Adicionar `<SalesIntegrationCard type="eduzz" ... />`
- Salvar `eduzz_product_ids` no update

### 6. Migração de Banco de Dados

```sql
ALTER TABLE projects ADD COLUMN eduzz_product_ids TEXT[] DEFAULT '{}';
```

---

## Fluxo de Sincronização

```text
ProjectEdit (salva eduzz_product_ids)
        │
        ▼
sync-project-data
        │
        ├─► Kiwify (se houver produtos)
        ├─► Hotmart (se houver produtos)
        ├─► Guru (se houver produtos)
        └─► Eduzz (se houver produtos) ◄── NOVO
        │
        ▼
   batchUpsertSales (source: 'eduzz')
```

---

## Campos Mapeados

| Eduzz API | Campo DB |
|-----------|----------|
| `id` | `kiwify_sale_id` (prefixo `eduzz_`) |
| `netGain.value` | `amount` |
| `total.value` / `grossGain.value` | `gross_amount` |
| `status` | `status` (normalizado) |
| `payment.method` | `payment_method` |
| `buyer.name` | `customer_name` |
| `buyer.email` | `customer_email` |
| `paidAt` / `createdAt` | `sale_date` |
| `tracker` | `utm_source` |
| `tracker2` | `utm_campaign` |
| `tracker3` | `utm_content` |
| (fixo) | `source: 'eduzz'` |

---

## Verificações Pós-Implementação

1. Conectar credenciais Eduzz no ProjectEdit
2. Verificar se lista de produtos é carregada
3. Sincronizar projeto
4. Confirmar vendas Eduzz aparecem no dashboard
5. Validar que o label dinâmico mostra "Eduzz"
