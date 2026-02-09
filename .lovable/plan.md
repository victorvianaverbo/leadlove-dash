
# Script de Rastreamento UTM para WordPress + Hotmart

## O que sera feito

Criar uma Edge Function que serve um script JavaScript leve. O cliente (Charles) cola uma unica linha no WordPress e todos os links da Hotmart na pagina de vendas passam a receber os UTMs automaticamente.

## Como funciona

1. Visitante clica no anuncio do Facebook/Google com UTMs na URL
2. Chega na pagina de vendas (WordPress)
3. O script captura os UTMs e salva em cookie (30 dias)
4. Quando clica no botao de compra (link Hotmart), o script anexa os UTMs ao link
5. Hotmart registra os UTMs no tracking da compra
6. MetrikaPRO captura via API normalmente na sincronizacao

## Resultado para o cliente

Colar isso no WordPress (Aparencia > Editor de Tema > footer.php, ou via plugin "Insert Headers and Footers"):

```html
<script src="https://ohwaygqxelyaytljbcsb.supabase.co/functions/v1/tracking-script" defer></script>
```

Uma linha. Pronto.

## Implementacao tecnica

### 1. Criar Edge Function `tracking-script`

**Arquivo:** `supabase/functions/tracking-script/index.ts`

Serve um arquivo JavaScript puro (Content-Type: application/javascript) que:
- Captura `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` da URL
- Salva em cookie `_mk_utm` com validade de 30 dias
- Encontra todos os links `<a>` que apontam para dominios da Hotmart (`hotmart.com`, `pay.hotmart.com`, `go.hotmart.com`)
- Anexa os UTMs como `src`, `sck` e query params nesses links (a Hotmart usa `src` para source tracking)
- Usa MutationObserver para links adicionados dinamicamente (SPAs, pop-ups)
- Peso estimado: ~1.5KB minificado, sem dependencias

### 2. Registrar no config.toml

Adicionar entrada `[functions.tracking-script]` com `verify_jwt = false` (precisa ser publico).

### 3. Adicionar secao na pagina de edicao do projeto

**Arquivo:** `src/pages/ProjectEdit.tsx`

Novo Card "Script de Rastreamento" com:
- Snippet copiavel pronto para uso
- Botao "Copiar" com feedback visual
- Instrucoes simples: "Cole antes do `</body>` no seu site"
- Icone de codigo para identificacao visual

| Arquivo | Acao |
|---------|------|
| `supabase/functions/tracking-script/index.ts` | Criar |
| `supabase/config.toml` | Adicionar config (automatico) |
| `src/pages/ProjectEdit.tsx` | Adicionar Card com snippet copiavel |
