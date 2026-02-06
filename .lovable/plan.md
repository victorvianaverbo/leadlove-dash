
## Corrigir erro "Erro ao atualizar usuario" no painel admin

### Problema
As requisicoes PUT para a edge function `admin-users` falham com "Failed to fetch" porque o relay de edge functions do Supabase nao suporta o metodo PUT. A edge function ja tem logica para tratar POST com `user_id` no body como operacao de update (linhas 244-250), mas o frontend esta enviando PUT.

### Solucao
Alterar o `handleSaveUser` em `src/pages/Admin.tsx` para usar `method: "POST"` ao inves de `method: "PUT"`.

### Alteracao

**Arquivo: `src/pages/Admin.tsx` (~linha 113)**

Trocar:
```typescript
const { error } = await supabase.functions.invoke("admin-users", {
  method: "PUT",
  headers: { Authorization: `Bearer ${session.access_token}` },
  body: { ... },
});
```

Por:
```typescript
const { error } = await supabase.functions.invoke("admin-users", {
  headers: { Authorization: `Bearer ${session.access_token}` },
  body: { ... },
});
```

Remover o `method: "PUT"` e deixar o padrao POST. A edge function ja detecta que o body contem `user_id` e roteia para a funcao `handlePut` automaticamente.

Nenhuma outra alteracao necessaria - a edge function ja esta preparada para isso.
