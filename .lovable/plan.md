

## Corrigir erro "invalid input syntax for type uuid" no ProjectView

### Problema
Quando o usuario acessa um projeto pela URL com slug (ex: `/projects/emi-terapeuta`), o sistema usa o slug como se fosse UUID em queries de `sales`, `ad_spend`, `daily_reports`, etc. Isso gera dezenas de erros no banco a cada acesso.

O mesmo problema existe no `ProjectEdit.tsx`.

### Causa raiz
- `ProjectView.tsx` recebe `id` da URL via `useParams` (que pode ser UUID ou slug)
- A query de projeto resolve corretamente (busca por slug quando nao e UUID)
- Porem, queries subsequentes usam `id` da URL diretamente como `project_id`, em vez de usar `project.id` (o UUID real)

### Correcao

**Arquivo: `src/pages/ProjectView.tsx`**

1. Criar variavel `projectId` derivada do projeto carregado:
```typescript
const projectId = project?.id;  // UUID real, nao o slug da URL
```

2. Garantir que TODAS as queries que usam `project_id` utilizem `projectId` (o UUID real do projeto) em vez de `id` (parametro da URL que pode ser slug).

3. Verificar se queries de `integrations`, `sales`, `ad_spend`, `daily_reports` estao usando o `project.id` correto.

**Arquivo: `src/pages/ProjectEdit.tsx`**

1. Mesma correcao: garantir que queries usem `project.id` em vez do `id` da URL.

### Verificacao

Apos a correcao, os erros `invalid input syntax for type uuid: "emi-terapeuta"` devem parar completamente no banco de dados.

### Arquivos alterados
- `src/pages/ProjectView.tsx` - usar `project.id` em vez de `id` da URL nas queries
- `src/pages/ProjectEdit.tsx` - mesma correcao
