

## Corrigir popup OAuth que nao fecha automaticamente

### Problema
O `window.open` usa `"_blank"` como target, o que faz o navegador abrir uma nova aba generica ao inves de uma popup nomeada. O `window.close()` so funciona de forma confiavel em janelas abertas pelo JavaScript com um nome especifico.

### Correcao

**Arquivo: `src/components/integrations/MetaAdsIntegrationCard.tsx`**

Trocar o target de `"_blank"` para um nome especifico como `"metaOAuthPopup"`:

```typescript
// Antes:
window.open(authUrl, "_blank", "width=600,height=700");

// Depois:
window.open(authUrl, "metaOAuthPopup", "width=600,height=700,left=200,top=100");
```

Isso garante que:
- O navegador abre uma popup real (nao uma aba)
- O `window.close()` na pagina de callback funciona corretamente
- O `window.opener` esta disponivel para o `postMessage`

Apenas uma linha precisa ser alterada.

