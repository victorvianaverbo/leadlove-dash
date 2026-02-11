

# Correcoes Prioritarias para Escala - MetrikaPRO

## Resumo

Seis correcoes em uma sessao para preparar o sistema para venda em escala, cobrindo seguranca, performance e limpeza de codigo.

---

## 1. Trocar SETTINGS_CARD_USER_ID hardcoded por isAdmin

**Arquivo:** `src/pages/ProjectView.tsx`

- Remover a constante `SETTINGS_CARD_USER_ID` (linha 30)
- Substituir `user?.id === SETTINGS_CARD_USER_ID` por `isAdmin` (linha 801)
- `isAdmin` ja vem do `useAuth()` (linha 34)

---

## 2. Mover PUBLIC_DOMAIN para variavel de ambiente

**Arquivo:** `src/pages/ProjectView.tsx`

- Remover `const PUBLIC_DOMAIN = 'https://metrikapro.com.br'` (linha 58)
- Usar `const PUBLIC_DOMAIN = import.meta.env.VITE_PUBLIC_DOMAIN || 'https://metrikapro.com.br'`
- Adicionar `VITE_PUBLIC_DOMAIN` no `.env` (nota: este arquivo eh gerenciado automaticamente, entao sera apenas uma referencia no codigo com fallback)

---

## 3. Reduzir polling de subscription de 60s para 5 minutos

**Arquivo:** `src/contexts/AuthContext.tsx`

- Alterar o intervalo de `60000` (60s) para `300000` (5 min) na linha do `setInterval`
- Isso reduz 5x as chamadas a edge function `check-subscription` em escala

---

## 4. Mover delete de projeto para Edge Function com transacao

**Novo arquivo:** `supabase/functions/delete-project/index.ts`

- Recebe `project_id` no body
- Valida autenticacao (token JWT)
- Valida ownership: verifica que o `user_id` do projeto corresponde ao usuario autenticado (ou que eh admin)
- Executa deletes em cascata usando o service role client:
  1. `metrics_cache` (por project_id)
  2. `daily_reports` (por project_id)
  3. `integrations` (por project_id)
  4. `ad_spend` (por project_id)
  5. `sales` (por project_id)
  6. `projects` (por id)
- Se qualquer delete falhar, retorna erro

**Arquivo modificado:** `src/pages/Dashboard.tsx`

- Substituir o `deleteProject` mutation que faz 5 deletes sequenciais no frontend por uma unica chamada `supabase.functions.invoke('delete-project', { body: { project_id } })`

---

## 5. Limpar console.logs de producao

**Arquivos:**
- `src/contexts/AuthContext.tsx`: remover `console.log` de auth events, token refresh, session refresh (manter `console.error` e `console.warn`)
- `src/pages/PublicDashboard.tsx`: remover `console.log` do sync (linha 435)

---

## 6. Remover user_id do tipo SalesPublic no PublicDashboard

**Arquivo:** `src/pages/PublicDashboard.tsx`

- Remover `user_id: string` da interface `SalesPublic` (linha 42), ja que esse campo nao existe mais na view `sales_public` apos a migracao de PII

---

## Detalhes Tecnicos

### Arquivos criados:
| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/delete-project/index.ts` | Edge function para delete seguro em cascata |

### Arquivos modificados:
| Arquivo | Mudanca |
|---------|---------|
| `src/pages/ProjectView.tsx` | Trocar hardcode por isAdmin + PUBLIC_DOMAIN por env |
| `src/contexts/AuthContext.tsx` | Polling 5min + limpar console.logs |
| `src/pages/Dashboard.tsx` | Delete via edge function |
| `src/pages/PublicDashboard.tsx` | Remover user_id do tipo + limpar console.log |
| `supabase/config.toml` | Adicionar config `verify_jwt = false` para delete-project |

