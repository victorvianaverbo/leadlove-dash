

## Corrigir "Acoes Recomendadas" no Dashboard Principal e Publico

### Problema identificado

**Dashboard Principal (ProjectView)**: A secao "Acoes Recomendadas da IA" nao aparece porque a politica de seguranca (RLS) da tabela `daily_reports` so permite que o **dono** do projeto veja os relatorios. Quando um admin acessa o projeto de outro usuario, a query retorna vazio.

**Dashboard Publico (PublicDashboard)**: A secao funciona para visitantes anonimos (projetos publicos), mas pode falhar silenciosamente para usuarios logados que nao sao donos.

### Solucao

**1. Adicionar politica RLS para admins na tabela `daily_reports`**

Criar nova politica que permite admins lerem relatorios de qualquer projeto:

```text
Policy: "Admins can view all reports"
Operacao: SELECT
Condicao: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
```

**2. Corrigir uso de `.single()` no PublicDashboard**

A query do `latestReport` no PublicDashboard usa `.single()` que pode gerar erro quando nao ha dados. Trocar para `.maybeSingle()` para consistencia (igual ao ProjectView que ja usa `.maybeSingle()`).

### Resultado esperado

- Admin vera as acoes recomendadas ao acessar projetos de outros usuarios
- Dashboard publico continuara funcionando normalmente para visitantes
- Nenhuma mudanca visual - apenas correcao de acesso aos dados
