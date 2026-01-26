
# Plano de Correção: Dashboard Loading + Valores Kiwify

## Visão Geral

Três problemas distintos a resolver:
1. Melhorar experiência de loading no Dashboard
2. Usar preço fixo do produto Kiwify ao invés de cálculo dinâmico
3. Evitar que sync sobrescreva valores corretos

---

## Problema 1: Loading Lento do Dashboard

### Situação Atual
- Quando `subscriptionLoading = true`, o usuário vê apenas um spinner pequeno
- Os projetos demoram a carregar e não há feedback visual adequado
- A imagem mostra a tela em estado intermediário confuso

### Solução
Criar um loading state visual com Skeleton cards enquanto carrega:

**Arquivo:** `src/pages/Dashboard.tsx`

```text
Mudanças:
1. Adicionar import do Skeleton
2. Criar componente DashboardSkeleton para mostrar durante carregamento
3. Mostrar skeleton enquanto `subscriptionLoading || projectsLoading`
```

**Layout do Skeleton:**
- Header fixo (já carregado)
- Card de plano com skeleton animado
- 3 cards de projetos com skeleton (receita, investimento, ROAS)

---

## Problema 2 & 3: Valores Kiwify Voltando ao Valor Errado

### Situação Atual

```typescript
// sync-project-data e sync-public-project (linhas 262-270 e 215-223)
const chargeAmount = sale.payment?.charge_amount || 0;
const platformFee = sale.payment?.fee || 0;
const grossAmount = chargeAmount > 0 
  ? (chargeAmount - platformFee) / 100 
  : netAmount;  // FALLBACK para valor errado!
```

**Problema:** Se a API Kiwify não retornar `payment.charge_amount` em algum momento, o `grossAmount` cai para `netAmount` (valor com coprodução), sobrescrevendo o valor correto.

### Solução Proposta

Adicionar um campo `ticket_price` no projeto para o preço fixo do produto Kiwify. Quando configurado, usar esse valor como `gross_amount`:

**Passo 1: Adicionar coluna no banco**

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS kiwify_ticket_price DECIMAL(10,2);
```

**Passo 2: UI para configurar preço do ticket**

No `ProjectEdit.tsx`, adicionar campo:

```text
Configurações Kiwify
├── Produtos selecionados (já existe)
├── [Novo] Preço do Ticket: R$ _____
│   Tooltip: "Valor fixo do produto. Será usado como faturamento bruto para cada venda."
└── Usar valor bruto para ROAS (toggle já existe)
```

**Passo 3: Modificar funções de sync**

**Arquivo:** `supabase/functions/sync-project-data/index.ts`
**Arquivo:** `supabase/functions/sync-public-project/index.ts`

```typescript
// Antes (problemático)
const grossAmount = chargeAmount > 0 
  ? (chargeAmount - platformFee) / 100 
  : netAmount;

// Depois (com preço fixo)
const ticketPrice = project.kiwify_ticket_price;

const grossAmount = ticketPrice 
  ? ticketPrice  // Preço fixo do produto
  : (chargeAmount > 0 
    ? (chargeAmount - platformFee) / 100 
    : netAmount);
```

---

## Resumo das Alterações

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Dashboard.tsx` | Adicionar skeleton loading visual |
| `projects` table | Adicionar coluna `kiwify_ticket_price` |
| `src/pages/ProjectEdit.tsx` | Campo para configurar preço do ticket |
| `sync-project-data/index.ts` | Usar preço fixo quando configurado |
| `sync-public-project/index.ts` | Usar preço fixo quando configurado |

---

## Resultado Esperado

1. **Dashboard:** Loading visual com skeletons animados
2. **Kiwify:** Campo para definir preço fixo R$22,08
3. **Sync:** Nunca mais sobrescreve com valor errado

---

## Seção Técnica

### Skeleton Component Structure

```tsx
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Plan Card Skeleton */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Project Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between py-2 border-b">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between py-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Sync Logic Update

```typescript
// Em sync-project-data e sync-public-project
const ticketPrice = project.kiwify_ticket_price 
  ? parseFloat(project.kiwify_ticket_price) 
  : null;

// Na loop de vendas:
const grossAmount = ticketPrice !== null
  ? ticketPrice
  : (chargeAmount > 0 
      ? (chargeAmount - platformFee) / 100 
      : netAmount);

console.log(`Sale ${sale.id}: using ${ticketPrice ? 'ticket price' : 'calculated'} gross_amount = ${grossAmount}`);
```

### Database Migration

```sql
-- Add ticket price column
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS kiwify_ticket_price DECIMAL(10,2);

-- Comment for documentation
COMMENT ON COLUMN projects.kiwify_ticket_price IS 
  'Fixed product price for Kiwify. When set, used as gross_amount instead of dynamic calculation.';
```
