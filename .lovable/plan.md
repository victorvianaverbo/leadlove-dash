

## Corrigir OAuth do Facebook - Dois Problemas

### Problema 1: Pagina 404 apos redirect
A edge function redireciona para `/projeto/{id}/editar`, mas a rota configurada no React Router e `/projects/{id}/edit`. Por isso aparece 404.

**Correcao**: Alterar a funcao `getAppRedirectUrl` na edge function para usar o caminho correto.

### Problema 2: "Error validating client secret"
Este erro vem do Facebook durante a troca do codigo por token. Significa que o `META_APP_SECRET` configurado esta incorreto ou foi alterado no painel do Meta.

**Verificacao necessaria**: Confirme que o App Secret no Meta Developers (Configuracoes > Basico > Chave Secreta do Aplicativo) corresponde ao valor salvo no backend.

---

### Alteracoes tecnicas

**Arquivo: `supabase/functions/meta-oauth-callback/index.ts`**

Alterar a funcao `getAppRedirectUrl` para usar o caminho correto:

```text
// DE:
return `${origin}/projeto/${projectId}/editar?${params.toString()}`;

// PARA:
return `${origin}/projects/${projectId}/edit?${params.toString()}`;
```

**Secret `META_APP_SECRET`**: Solicitar ao usuario que verifique e atualize o valor caso esteja incorreto.

