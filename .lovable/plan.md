

## Fallback visual na popup OAuth

### Problema
Navegadores bloqueiam `window.close()` apos redirecionamentos por dominios externos (Facebook). A popup fica aberta mostrando apenas texto sem formatacao.

### Correcao

**Arquivo: `supabase/functions/meta-oauth-callback/index.ts`**

Atualizar a funcao `popupResponse` para mostrar uma pagina bonita com:

- Icone de sucesso (checkmark verde) ou erro (X vermelho)
- Mensagem clara: "Conta conectada com sucesso!" / "Erro na conexao"
- Instrucao: "Pode fechar esta janela e atualizar com F5"
- Botao "Fechar janela" que tenta `window.close()`
- Manter o `postMessage` para atualizar a aba principal automaticamente
- Tentar `window.close()` automaticamente apos 100ms

Para erro, mostrar a mensagem de erro e instrucao para tentar novamente.

Apenas a funcao `popupResponse` no final do arquivo precisa ser alterada. O resto da edge function e o frontend permanecem iguais.

