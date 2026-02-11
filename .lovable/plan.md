

## Plano: Meta Pixel + Conversions API (CAPI)

### O que sera feito

1. **Salvar os secrets** (META_PIXEL_ID e META_PIXEL_ACCESS_TOKEN) de forma segura no backend
2. **Meta Pixel no frontend** - Carregar o script do Pixel em todas as paginas e disparar eventos:
   - `PageView` em todas as paginas
   - `ViewContent` na landing page
   - `InitiateCheckout` ao abrir o modal de checkout
   - `Purchase` na pagina `/checkout/success`
3. **CAPI via Edge Function** - Criar uma edge function `meta-capi` que envia o evento `Purchase` server-side para o Meta, garantindo maior precisao na atribuicao (nao depende de bloqueadores de anuncios)
4. **Deduplicacao** - Usar um `event_id` compartilhado entre Pixel (browser) e CAPI (server) para evitar contagem duplicada

### Fluxo

```text
Usuario compra no Stripe
        |
        v
  /checkout/success
        |
   +---------+---------+
   |                   |
   v                   v
Meta Pixel          Edge Function
(browser)           meta-capi (server)
fbq('track',        POST /meta-capi
'Purchase')         { event: 'Purchase',
event_id: X           event_id: X }
   |                   |
   +--------+----------+
            |
            v
     Meta deduplica
     pelo event_id
```

### Detalhes tecnicos

**Secrets necessarios (2 novos):**
- `META_PIXEL_ID` - ID do Pixel do Meta (encontrado em Gerenciador de Eventos do Facebook)
- `META_PIXEL_ACCESS_TOKEN` - Token de acesso do CAPI (gerado em Gerenciador de Eventos > Configuracoes > API de Conversoes > Gerar token)

**Arquivos a criar:**
- `supabase/functions/meta-capi/index.ts` - Edge function que envia eventos server-side para `graph.facebook.com/v21.0/{pixel_id}/events`

**Arquivos a modificar:**
- `index.html` - Adicionar script base do Meta Pixel (usando o PIXEL_ID como variavel de ambiente VITE)
- `src/pages/CheckoutSuccess.tsx` - Disparar `fbq('track', 'Purchase', {value, currency})` com event_id e chamar a edge function `meta-capi` com o mesmo event_id
- `src/pages/Index.tsx` - Disparar `fbq('track', 'ViewContent')` na landing page
- `src/components/CheckoutModal.tsx` - Disparar `fbq('track', 'InitiateCheckout')` ao abrir o modal
- `supabase/config.toml` - Registrar a nova edge function `meta-capi`

**Valor do Purchase:**
- Sera extraido do plano assinado (R$97, R$197, R$397 ou R$997) usando os dados do `stripe-plans.ts`
- Currency: `BRL`

