
# Remover Trial em Upgrades

## Problema Identificado

Ambas as edge functions de checkout sempre adicionam `trial_period_days: 7`, mesmo quando o usuário já é assinante e está fazendo upgrade:

- `create-embedded-checkout/index.ts` → linha 73: `trial_period_days: 7`
- `create-checkout/index.ts` → linha 73: `trial_period_days: 7`

---

## Solução

Antes de criar a sessão Stripe, verificar se o cliente já possui uma assinatura ativa ou em trial. Se sim, não adicionar trial.

```text
FLUXO:
┌─────────────────────────────────────────────────────────────────────┐
│  1. Buscar cliente Stripe pelo email                               │
│  2. SE cliente existe → buscar assinaturas (active ou trialing)    │
│  3. SE tem assinatura → criar sessão SEM trial_period_days         │
│  4. SE não tem → criar sessão COM trial_period_days: 7             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Alterações

### create-embedded-checkout/index.ts

| Linha | Antes | Depois |
|-------|-------|--------|
| 55-77 | Cria sessão com trial fixo | Verifica assinatura antes de adicionar trial |

### create-checkout/index.ts

| Linha | Antes | Depois |
|-------|-------|--------|
| 57-80 | Cria sessão com trial fixo | Verifica assinatura antes de adicionar trial |

---

## Código da Verificação

```typescript
// Verificar se cliente tem assinatura ativa/trialing
let hasActiveSubscription = false;
if (customerId) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 10,
  });
  hasActiveSubscription = subscriptions.data.some(
    (sub) => sub.status === "active" || sub.status === "trialing"
  );
  logStep("Subscription check", { hasActiveSubscription });
}

// Criar sessão - sem trial se já tem assinatura
const session = await stripe.checkout.sessions.create({
  // ... configs ...
  subscription_data: hasActiveSubscription
    ? { metadata: { user_id: user.id } }
    : { trial_period_days: 7, metadata: { user_id: user.id } },
  // ... resto ...
});
```

---

## Arquivos a Modificar

| Arquivo | Tipo |
|---------|------|
| `supabase/functions/create-embedded-checkout/index.ts` | Editar |
| `supabase/functions/create-checkout/index.ts` | Editar |
