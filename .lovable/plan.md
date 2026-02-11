

## Correção: Race Condition do Meta Pixel no Purchase

### Problema
Quando o usuário chega em `/checkout/success`, o evento `Purchase` do Pixel dispara antes do script `fbevents.js` terminar de carregar. O `window.fbq` ainda não existe, então o evento é ignorado silenciosamente. O CAPI (server-side) funciona normalmente.

### Solução
Adicionar um mecanismo de retry no `trackEvent` que aguarda o Pixel carregar antes de disparar o evento.

### Arquivos a modificar

**1. `src/lib/meta-pixel.ts`**
- Criar uma função `waitForPixel()` que retorna uma Promise resolvida quando `window.fbq` estiver disponível (polling a cada 200ms, timeout de 5s)
- Criar uma nova função `trackEventWithRetry()` que chama `waitForPixel()` antes de disparar o evento
- Manter `trackEvent()` original para eventos onde o pixel já está carregado (ViewContent, InitiateCheckout)

**2. `src/pages/CheckoutSuccess.tsx`**
- Trocar `trackEvent` por `trackEventWithRetry` para o evento Purchase
- Isso garante que o evento aguarda o pixel carregar antes de disparar

### Detalhes técnicos

```text
waitForPixel()
  |
  v
window.fbq existe? --SIM--> resolve()
  |
  NAO
  |
  v
Tenta novamente em 200ms
(max 25 tentativas = 5s)
  |
  v
Timeout? --> resolve() mesmo assim
            (CAPI já garantiu o evento)
```

A função `waitForPixel` faz polling simples. Se o pixel não carregar em 5 segundos, segue em frente sem erro -- o CAPI já cobriu o evento server-side.
