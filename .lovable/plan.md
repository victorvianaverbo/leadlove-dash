

# URLs Amigáveis para Projetos

## Objetivo

Substituir as URLs com UUIDs (`/projects/25eb6e21-0760-4e30-b177-29e20346a8a7`) por URLs amigáveis com o nome do projeto (`/projects/meu-projeto`).

---

## Estrutura Atual

```text
URLs atuais:
├── /projects/25eb6e21-0760-4e30-b177-29e20346a8a7        (ProjectView)
├── /projects/25eb6e21-0760-4e30-b177-29e20346a8a7/edit  (ProjectEdit)
└── /meu-projeto                                          (PublicDashboard - já usa slug!)
```

O sistema já possui:
- Coluna `slug` na tabela `projects`
- Função `generateSlug()` que converte nome em slug
- Rota pública `/:slug` funcionando com slugs

---

## Solução Proposta

Usar o **slug** como identificador principal nas URLs do usuário logado, mantendo compatibilidade com UUIDs existentes.

```text
URLs novas:
├── /projects/meu-projeto         (ProjectView)
├── /projects/meu-projeto/edit    (ProjectEdit)
└── /meu-projeto                  (PublicDashboard - sem mudança)
```

---

## Alterações Necessárias

### 1. Garantir Slug em Todos os Projetos

| Ação | Descrição |
|------|-----------|
| SQL Migration | Gerar slugs para projetos existentes que não têm |
| ProjectNew | Gerar e salvar slug ao criar novo projeto |

### 2. Buscar Projeto por Slug ou UUID

As páginas ProjectView e ProjectEdit precisam aceitar tanto slug quanto UUID para manter retrocompatibilidade com links antigos.

```typescript
// Lógica de busca híbrida
const isUUID = /^[0-9a-f-]{36}$/i.test(id);

if (isUUID) {
  // Busca por ID (compatibilidade com links antigos)
  query.eq('id', id);
} else {
  // Busca por slug (nova forma)
  query.eq('slug', id);
}
```

### 3. Atualizar Navegações para Usar Slug

| Arquivo | Alteração |
|---------|-----------|
| `Dashboard.tsx` | Navegar para `/projects/${project.slug}` |
| `ProjectCard.tsx` | Receber e usar slug no onClick |
| `ProjectEdit.tsx` | Navegar de volta usando slug |
| `ProjectNew.tsx` | Após criar, redirecionar usando slug |

### 4. Garantir Unicidade do Slug

Adicionar constraint no banco e lógica para resolver conflitos:
- Se "meu-projeto" já existe, usar "meu-projeto-2"
- Constraint UNIQUE na coluna slug

---

## Fluxo de Resolução de Conflitos

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Usuário cria projeto "Meu Projeto"                                │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Sistema gera slug: "meu-projeto"                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Verifica se slug existe para o mesmo user_id                      │
│  (mesmo usuário pode ter projetos com nomes similares)             │
└─────────────────────────────────────────────────────────────────────┘
                     ↓                              ↓
              Não existe                        Já existe
                     ↓                              ↓
         Usa "meu-projeto"              Tenta "meu-projeto-2"
                                                    ↓
                                        Continua até encontrar único
```

---

## Arquivos a Modificar

| Arquivo | Tipo | Alteração |
|---------|------|-----------|
| `supabase/migrations/` | Novo | Migration para gerar slugs e adicionar constraint |
| `src/pages/ProjectView.tsx` | Editar | Busca híbrida por slug ou UUID |
| `src/pages/ProjectEdit.tsx` | Editar | Busca híbrida e navegação por slug |
| `src/pages/ProjectNew.tsx` | Editar | Gerar slug único na criação |
| `src/pages/Dashboard.tsx` | Editar | Usar slug na navegação |
| `src/components/dashboard/ProjectCard.tsx` | Editar | Receber slug na prop |
| `src/lib/utils.ts` | Editar | Adicionar `generateSlug()` como utilitário |

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| `/projects/25eb6e21-0760-4e30-b177-29e20346a8a7` | `/projects/funil-com-ia` |
| URL feia e sem significado | URL legível e compartilhável |
| Difícil lembrar/digitar | Fácil identificar o projeto |

---

## Seção Técnica

### Migration SQL

```sql
-- Gerar slugs para projetos existentes
UPDATE projects
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Resolver conflitos adicionando sufixo numérico
-- (função PL/pgSQL para lidar com duplicatas)

-- Adicionar constraint de unicidade por usuário
ALTER TABLE projects 
ADD CONSTRAINT projects_user_slug_unique 
UNIQUE (user_id, slug);
```

### Função de Geração de Slug Único

```typescript
const generateUniqueSlug = async (name: string, userId: string): Promise<string> => {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('slug', slug)
      .maybeSingle();
    
    if (!data) break; // Slug disponível
    
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  
  return slug;
};
```

### Busca Híbrida (UUID ou Slug)

```typescript
const { data: project } = useQuery({
  queryKey: ['project', identifier],
  queryFn: async () => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    let query = supabase
      .from('projects')
      .select('*');
    
    if (isUUID) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('slug', identifier).eq('user_id', user!.id);
    }
    
    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },
});
```

