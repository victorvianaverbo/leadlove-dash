

## Permitir Admin Atualizar Projetos de Clientes

### Problema
Quando voce (admin) edita o projeto do "charles" e clica "Salvar Configuracoes", a atualizacao falha silenciosamente. Isso acontece porque a politica de seguranca (RLS) da tabela `projects` so permite UPDATE para o dono do projeto (`auth.uid() = user_id`). Nao existe uma politica de UPDATE para admins.

### Politicas atuais da tabela `projects`
- SELECT: dono do projeto OU admin OU projetos publicos
- INSERT: apenas dono
- UPDATE: **apenas dono** (falta admin)
- DELETE: apenas dono

### Solucao
Criar uma nova politica RLS que permite usuarios com role `admin` fazer UPDATE em qualquer projeto.

### Alteracao

**1. Migracao SQL** - Adicionar politica de UPDATE para admins:
```sql
CREATE POLICY "Admins can update all projects"
ON public.projects FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

Isso segue o mesmo padrao ja usado na politica "Admins can view all projects" que ja existe.

### Resultado
Apos essa alteracao, voce podera selecionar campanhas (ou qualquer outro campo) nos projetos de clientes e salvar normalmente.

