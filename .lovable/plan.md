

# Plano: Ajustes na Interface do Projeto

## Resumo dos 3 Pedidos

1. **Ticket price no dashboard público**: ✅ Já corrigido na migração anterior
2. **Remover seção "Benchmarks de Funil"**: Excluir o Card inteiro das linhas 219-284
3. **Integrações sempre recolhidas**: Mudar lógica para iniciar todas fechadas

---

## Mudanças Técnicas

### 1. Remover Card de Benchmarks de Funil
**Arquivo:** `src/pages/ProjectEdit.tsx`

Excluir o Card completo (linhas 219-284) que contém:
- Engajamento (%)
- CTR Link (%)
- Taxa LP (%)
- Checkout (%)
- Venda/LP (%)

O estado e a lógica de save dos benchmarks podem permanecer no código (usados pela IA nos relatórios), mas a interface de edição será removida.

### 2. Integrações Sempre Recolhidas
**Arquivo:** `src/pages/ProjectEdit.tsx`

Alterar a lógica no `useEffect` (linhas 108-118):

```typescript
// ANTES: Abre apenas integrações desconectadas
useEffect(() => {
  if (integrations) {
    const disconnected: string[] = [];
    if (!kiwifyIntegration?.is_active) disconnected.push('kiwify');
    // ...
    setOpenIntegrations(disconnected);
  }
}, [...]);

// DEPOIS: Todas fechadas por padrão
useEffect(() => {
  if (integrations) {
    setOpenIntegrations([]); // Sempre vazio = tudo fechado
  }
}, [integrations]);
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ProjectEdit.tsx` | Remover Card de Benchmarks (linhas 219-284) |
| `src/pages/ProjectEdit.tsx` | Alterar useEffect para fechar todas integrações |

---

## Resultado Esperado

1. ✅ Dashboard público usa ticket price (já implementado)
2. ✅ Seção "Benchmarks de Funil" removida da tela de edição
3. ✅ Todas as integrações (Kiwify, Hotmart, Guru, Meta) aparecem **fechadas** por padrão

A configuração de benchmarks continua salva no banco de dados e disponível para os relatórios da IA, apenas a interface de edição é removida para simplificar a tela.

