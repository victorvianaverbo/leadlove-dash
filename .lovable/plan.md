

# Esconder Card "Configurações do Projeto" para Usuários Específicos

## Resumo

O card "Configurações do Projeto" será exibido **apenas** para o usuário com UUID `3ce82838-0c77-48ed-9530-9788e885778f`. Todos os outros usuários não verão esse card.

---

## Alteração

Adicionar uma verificação condicional que renderiza o card apenas se o usuário logado tiver o ID específico.

| Local | Modificação |
|-------|-------------|
| `src/pages/ProjectView.tsx` | Envolver o card (linhas 693-803) em uma condição que verifica `user?.id` |

---

## Código

```typescript
// Constante com o ID do cliente autorizado
const SETTINGS_CARD_USER_ID = '3ce82838-0c77-48ed-9530-9788e885778f';

// Renderização condicional
{user?.id === SETTINGS_CARD_USER_ID && (
  <Card className="mb-6">
    {/* ... conteúdo do card ... */}
  </Card>
)}
```

---

## Arquivo a Modificar

| Arquivo | Tipo |
|---------|------|
| `src/pages/ProjectView.tsx` | Editar |

