## Mudança

No rodapé de cada `ProjectCard`, substituir a bolinha cinza/verde + texto "sincronizado há X" por um **badge "Ativo" / "Inativo"** mais visível, mantendo o tempo da última sincronização ao lado em cinza pequeno.

### Critério de "Ativo"
Um projeto é considerado **Ativo** quando:
- tem ao menos 1 integração ativa (`integrations.length > 0`), **e**
- já sincronizou pelo menos uma vez (`project.last_sync_at` existe)

Caso contrário → **Inativo**.

### Visual

**Ativo** (verde):
```
[● Ativo]  sincronizado há 2 dias
```
- Pill verde suave: fundo `bg-success/10`, texto `text-success`, dot verde sólido `bg-success`
- Padding `px-2 py-0.5`, `rounded-full`, `text-[11px] font-medium`

**Inativo** (cinza):
```
[● Inativo]  nunca sincronizado
```
- Pill cinza: fundo `bg-muted`, texto `text-muted-foreground`, dot cinza

O texto de tempo (`sincronizado há X`) continua à direita do pill, em `text-[11px] text-muted-foreground`, para não perder a informação.

## Arquivo afetado
- `src/components/dashboard/ProjectCard.tsx` — apenas o bloco do footer (linhas 168-182). Nenhuma mudança em props, queries, ou lógica de métricas.

## Resultado esperado
Olhando a grade de projetos, em uma fração de segundo dá pra distinguir quais estão funcionando (badge verde "Ativo") dos que estão parados (badge cinza "Inativo"), sem precisar ler texto pequeno.
