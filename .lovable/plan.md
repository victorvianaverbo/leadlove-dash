

## Auto-sincronizar ao salvar configuracoes

### O que muda para o usuario
Ao clicar em "Salvar Configuracoes" na pagina de edicao, o usuario sera redirecionado ao dashboard do projeto e a sincronizacao comecara automaticamente, com a mensagem de progresso visivel ("Conectando as APIs...", "Gerando relatorio...", etc.). Nao sera mais necessario clicar manualmente no botao "Atualizar".

### Como funciona

**1. Passar sinal via URL (src/pages/ProjectEdit.tsx)**
- No `onSuccess` da mutation, navegar com um parametro na URL: `/projects/{slug}?sync=true`
- Alterar a mensagem do toast para: "Configuracoes salvas! Sincronizando dados..."

**2. Detectar e disparar sync automatico (src/pages/ProjectView.tsx)**
- Ao carregar a pagina, verificar se o parametro `?sync=true` esta presente na URL
- Se estiver, disparar `syncData.mutate()` automaticamente assim que o projeto estiver carregado
- Remover o parametro `sync` da URL (usando `replace`) para evitar re-sync ao recarregar a pagina

### Detalhes tecnicos

**ProjectEdit.tsx** - Alterar o `onSuccess`:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['project', id] });
  queryClient.invalidateQueries({ queryKey: ['projects'] });
  toast({ 
    title: "Configuracoes salvas!", 
    description: "Sincronizando dados do projeto..."
  });
  navigate(`/projects/${project?.slug || id}?sync=true`);
},
```

**ProjectView.tsx** - Adicionar useEffect para auto-sync:
```typescript
// Auto-sync when coming from project edit
const [searchParams, setSearchParams] = useSearchParams();

useEffect(() => {
  if (searchParams.get('sync') === 'true' && projectId && !syncData.isPending) {
    searchParams.delete('sync');
    setSearchParams(searchParams, { replace: true });
    syncData.mutate();
  }
}, [projectId, searchParams]);
```

- Importar `useSearchParams` de `react-router-dom`
- O fluxo de progresso existente (connecting -> importing -> processing -> done) ja sera exibido automaticamente, dando feedback claro ao usuario

