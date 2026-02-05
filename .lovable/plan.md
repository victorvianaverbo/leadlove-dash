

# Prefixo "act_" Fixo no Campo Ad Account ID

## Resumo

Modificar o campo "Ad Account ID" para exibir o prefixo `act_` fixo antes do input, permitindo que o usuário cole apenas o número do ID.

---

## Interface Atual vs Nova

| Atual | Nova |
|-------|------|
| `[_________________]` | `act_ [_____________]` |
| Placeholder: "Ex: act_123456789" | Placeholder: "123456789" |

---

## Alterações

### MetaAdsIntegrationCard.tsx

| Linhas | Modificação |
|--------|-------------|
| 47 | Estado `adAccountId` armazena apenas o número (sem `act_`) |
| 52-56 | useEffect remove prefixo `act_` ao carregar credenciais existentes |
| 89, 105 | Ao salvar, concatena `act_` + número |
| 256-267 | Campo com prefixo fixo visual usando flex container |

---

## Código do Campo

```tsx
<div>
  <label className="text-sm font-medium">Ad Account ID</label>
  <div className="flex">
    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
      act_
    </span>
    <Input
      value={adAccountId}
      onChange={(e) => {
        // Remove act_ se o usuário colar o ID completo
        const value = e.target.value.replace(/^act_/, '');
        setAdAccountId(value);
      }}
      placeholder="123456789"
      className="rounded-l-none"
    />
  </div>
</div>
```

---

## Lógica de Tratamento

1. **Ao carregar**: Remove `act_` do valor existente para exibir apenas o número
2. **Ao digitar/colar**: Remove `act_` automaticamente se usuário colar ID completo
3. **Ao salvar**: Concatena `act_` + número para enviar à API

---

## Arquivo a Modificar

| Arquivo | Tipo |
|---------|------|
| `src/components/integrations/MetaAdsIntegrationCard.tsx` | Editar |

