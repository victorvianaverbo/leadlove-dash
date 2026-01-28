
# Plano de Correção - Erro de Sincronização "signal is aborted without reason"

## Diagnóstico

O erro **"signal is aborted without reason"** exibido no dashboard Medsimple é causado por uma **falha de deploy da Edge Function**. A análise dos logs revela:

```
POST | 404 | https://ohwaygqxelyaytljbcsb.supabase.co/functions/v1/sync-project-data
```

A função `sync-project-data` está retornando **HTTP 404 (Not Found)**, indicando que a versão mais recente do código não foi corretamente implantada no Supabase após as últimas modificações (correções do Guru e Hotmart).

---

## Causa Raiz

Quando uma Edge Function não está acessível (404), a chamada `supabase.functions.invoke()` no frontend falha com uma mensagem genérica "signal is aborted" porque a promise é rejeitada antes de receber uma resposta válida.

---

## Solução

### Passo 1: Redeployar a Edge Function

Forçar o redeploy da função `sync-project-data` para garantir que a versão corrigida (com parâmetros Guru `confirmed_at_ini` e tratamento de erro Hotmart) seja implantada.

### Passo 2: Verificar o Deploy

Após o redeploy:
- Confirmar que a função responde com status 200
- Testar sincronização manual no projeto Medsimple
- Verificar logs para confirmar busca de vendas Guru/Hotmart

### Passo 3: Melhorar Tratamento de Erro no Frontend (Opcional)

Adicionar tratamento de erro mais específico no `ProjectView.tsx` para diferenciar entre:
- Erro de rede/timeout (404, 500)
- Erro de autenticação (401)
- Erro de dados da API (resposta com `data.error`)

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/sync-project-data/index.ts` | Redeploy forçado (nenhuma mudança de código necessária) |

---

## Ação Imediata

Executar redeploy da Edge Function e testar sincronização do projeto Medsimple.
