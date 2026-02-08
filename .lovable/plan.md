

## Popup OAuth: fechar janela ao finalizar conexao

### Problema atual
O `window.open` ja abre o Facebook numa janela popup, mas a edge function redireciona de volta para a URL do app, abrindo uma segunda aba com a pagina do projeto. O usuario fica com duas abas abertas.

### Solucao
Mudar a edge function para, ao inves de redirecionar (302), retornar uma pagina HTML que envia uma mensagem para a janela pai (`window.opener.postMessage`) e fecha a si mesma (`window.close()`). O frontend escuta essa mensagem e atualiza os dados.

### Mudancas

**1. Edge Function (`supabase/functions/meta-oauth-callback/index.ts`)**

Substituir o redirect final (status 302) por uma resposta HTML que:
- Envia `postMessage` para a janela pai com `{ type: 'meta-oauth-success' }` (ou `meta-oauth-error` com mensagem)
- Fecha a popup automaticamente com `window.close()`
- Mostra um fallback "Voce pode fechar esta janela" caso o `window.close()` falhe

Mesma logica para o caso de erro: ao inves de redirecionar, retorna HTML com `postMessage` de erro e fecha.

**2. Frontend (`src/components/integrations/MetaAdsIntegrationCard.tsx`)**

- Remover o `useEffect` que le `meta_oauth` da URL (nao sera mais necessario)
- Adicionar um `useEffect` com `window.addEventListener('message', handler)` que:
  - Valida a origem da mensagem
  - Se `type === 'meta-oauth-success'`: mostra toast, refetch queries, abre o card
  - Se `type === 'meta-oauth-error'`: mostra toast de erro
- Limpar o listener no cleanup do useEffect

### Detalhes tecnicos

**HTML retornado pela edge function (sucesso):**
```html
<html><body><script>
  window.opener.postMessage({ type: 'meta-oauth-success' }, '*');
  window.close();
</script><p>Conectado! Pode fechar esta janela.</p></body></html>
```

**HTML retornado pela edge function (erro):**
```html
<html><body><script>
  window.opener.postMessage({ type: 'meta-oauth-error', message: '...' }, '*');
  window.close();
</script><p>Erro na conexao. Pode fechar esta janela.</p></body></html>
```

**Listener no frontend:**
```typescript
useEffect(() => {
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'meta-oauth-success') {
      toast({ title: "Meta Ads conectado via Facebook!" });
      queryClient.refetchQueries({ queryKey: ['project-integrations', projectId], type: 'all' });
      queryClient.invalidateQueries({ queryKey: ['meta-campaigns', projectId] });
      onOpenChange(true);
    } else if (event.data?.type === 'meta-oauth-error') {
      toast({ title: "Erro no OAuth", description: event.data.message, variant: "destructive" });
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, [projectId]);
```
