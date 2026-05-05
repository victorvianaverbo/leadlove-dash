
## Objetivo

Liberar a assinatura do Bruno (cus_Toj5NRvfEGM1Vi) que está `past_due` por falta de saldo, e reagendar a próxima cobrança para 10/05/2026.

## Passos

### 1. Anular fatura aberta de R$997
- Void invoice `in_1TThpLLGJ9uCQzbbQ5G0teOT` (cobrança atual do plano)

### 2. Anular fatura aberta de R$197
- Void invoice `in_1TF1SxLGJ9uCQzbbAPLZzX1U` (cobrança pendente de plano anterior cancelado)

### 3. Reagendar assinatura para 10/05
- Atualizar o `billing_cycle_anchor` da assinatura `sub_1SxRNqLGJ9uCQzbbZz5hXVnU` para timestamp de 10/05/2026
- Isso vai:
  - Mudar o status de `past_due` para `active`
  - Agendar a próxima cobrança automática para 10/05/2026

### Resultado esperado
- Bruno volta a ter acesso imediato à plataforma
- Próxima cobrança de R$997 acontece automaticamente em 10/05/2026

## Detalhes técnicos
- Usar Stripe API: `POST /v1/invoices/{id}/void` para anular faturas
- Usar Stripe API: `POST /v1/subscriptions/{id}` com `billing_cycle_anchor` e `proration_behavior: none`
- Nenhuma alteração de código necessária
