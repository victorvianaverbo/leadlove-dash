

# Plano: Corrigir Isolamento de Dados - Usuários Vendo Projetos de Outros

## Problema Identificado

O usuário `contato@vianamidias` está vendo os projetos do `vianavictor` porque:

1. **Políticas RLS muito permissivas**: As políticas "Public can view shared projects" permitem que QUALQUER pessoa (incluindo usuários autenticados) veja projetos que têm `is_public = true`

2. **Query sem filtro de user_id**: O Dashboard busca todos os projetos que o RLS permite, sem filtrar pelo usuário atual

```sql
-- Políticas atuais (PROBLEMÁTICAS):
"Public can view shared projects" → (is_public = true AND share_token IS NOT NULL)
"Public can view shared projects by slug" → (is_public = true AND slug IS NOT NULL)
```

Resultado: Projetos públicos aparecem para TODOS os usuários logados, não apenas para o dono.

---

## Solução em Duas Partes

### Parte 1: Adicionar Filtro no Dashboard (Correção Imediata)

**Arquivo:** `src/pages/Dashboard.tsx`

Adicionar filtro `.eq('user_id', user.id)` na query de projetos:

```typescript
// ANTES (linha 95-98)
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .order('created_at', { ascending: false });

// DEPOIS
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', user.id)  // ← FILTRAR PELO USUÁRIO ATUAL
  .order('created_at', { ascending: false });
```

### Parte 2: Ajustar Políticas RLS (Defesa em Profundidade)

As políticas de projetos públicos devem permitir acesso apenas para usuários **não autenticados** (acesso via link público). Usuários autenticados devem ver apenas seus próprios projetos.

**Opção A: Restringir políticas públicas ao role `anon`**

```sql
-- Dropar políticas atuais
DROP POLICY IF EXISTS "Public can view shared projects" ON projects;
DROP POLICY IF EXISTS "Public can view shared projects by slug" ON projects;

-- Recriar com role anon (apenas usuários não logados)
CREATE POLICY "Anon can view shared projects by token"
ON projects FOR SELECT TO anon
USING (is_public = true AND share_token IS NOT NULL);

CREATE POLICY "Anon can view shared projects by slug"
ON projects FOR SELECT TO anon
USING (is_public = true AND slug IS NOT NULL);
```

**Opção B: Manter políticas mas combinar condições**

```sql
-- Usuários autenticados: apenas seus projetos
-- Ou: projetos públicos sem estar logado
CREATE POLICY "View projects policy"
ON projects FOR SELECT
USING (
  (auth.uid() = user_id)  -- Próprios projetos
  OR 
  (auth.uid() IS NULL AND is_public = true AND (share_token IS NOT NULL OR slug IS NOT NULL))  -- Públicos para anon
);
```

---

## Mudanças Recomendadas

| Arquivo/Local | Alteração | Prioridade |
|---------------|-----------|------------|
| `src/pages/Dashboard.tsx` | Adicionar `.eq('user_id', user.id)` | CRÍTICA |
| RLS `projects` | Restringir políticas públicas ao role `anon` | ALTA |
| Tabelas relacionadas | Verificar `sales`, `ad_spend`, `integrations` | ALTA |

---

## Verificação de Outras Tabelas

As tabelas `sales`, `ad_spend` e `integrations` também têm políticas "Public can view" que podem ter o mesmo problema:

- `sales`: "Public can view sales of shared projects" 
- `ad_spend`: "Public can view ad_spend of shared projects"

Essas políticas também devem ser restritas ao role `anon` para evitar vazamento de dados entre usuários.

---

## Resultado Esperado

Após a correção:

| Usuário | O que vê |
|---------|----------|
| `vianavictor` | Apenas seus 2 projetos (Adri e Sexólogo) |
| `contato@vianamidias` | Nenhum projeto (ainda não criou) |
| Visitante (não logado) | Dashboard público via link se projeto for público |

