

# Remoção da Tabela de Atribuição por UTM

## O que será removido

A tabela "Atribuição por UTM" será removida do dashboard admin (`ProjectView.tsx`).

---

## Alterações Necessárias

### 1. `src/pages/ProjectView.tsx`

**Remover:**
1. **Import** (linha 16): `import { LazyUtmTable } from '@/components/LazyUtmTable';`
2. **Código de agrupamento UTM** (linhas 480-495): lógica `salesByUtm` e `utmData`
3. **Renderização da tabela** (linhas 894-901): `<LazyUtmTable />` e sua div container

### 2. `src/components/skeletons/ProjectViewSkeleton.tsx`

**Remover:**
- Seção "UTM Table Skeleton" (linhas 75-99)

### 3. Arquivos opcionais para limpeza futura

- `src/components/LazyUtmTable.tsx` - Pode ser removido se não for usado em outros lugares

---

## Resultado

- Dashboard admin sem a tabela de UTM
- Código mais limpo sem lógica de agrupamento desnecessária
- Skeleton atualizado para refletir o layout correto

