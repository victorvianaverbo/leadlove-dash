

## Corrigir fluxo de selecao de conta e salvar

### Problema 1: Collapsible fecha ao selecionar conta de anuncios
Quando o usuario seleciona uma conta de anuncios, o `handleAdAccountChange` invalida a query `project-integrations`. Isso atualiza o estado `integrations`, que dispara o `useEffect` em `ProjectEdit.tsx` (linha 120) resetando `openIntegrations` para `[]` -- fechando tudo.

### Problema 2: Botao Salvar nao redireciona ao dashboard
O botao "Salvar Configuracoes" salva os dados mas permanece na pagina de edicao. O usuario quer ser redirecionado ao dashboard com os dados atualizados.

### Solucao

**Arquivo: `src/pages/ProjectEdit.tsx`**

1. Remover o `useEffect` que reseta `openIntegrations` quando `integrations` muda (linhas 119-124). Esse efeito fecha os collapsibles toda vez que qualquer integracao e atualizada.

2. No `onSuccess` da mutation `updateProject`, apos invalidar as queries, navegar de volta ao dashboard do projeto (`/projects/{slug}`) para que o usuario veja os dados atualizados imediatamente.

### Detalhes tecnicos

- Remover:
```
useEffect(() => {
  if (integrations) {
    setOpenIntegrations([]);
  }
}, [integrations]);
```

- Alterar o `onSuccess` do `updateProject`:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['project', id] });
  queryClient.invalidateQueries({ queryKey: ['projects'] });
  toast({
    title: "Configuracoes salvas!",
    description: "Use o botao Atualizar no Dashboard para sincronizar os dados."
  });
  navigate(`/projects/${project?.slug || id}`);
},
```

Isso resolve os dois problemas: o collapsible permanece aberto ao trocar de conta, e ao salvar o usuario volta direto ao dashboard.

