

# Atualizar Dominio de Email para vianamidias.com.br

## Objetivo

Alterar o endereco de remetente dos emails de autenticacao de `metrikapro.com.br` (nao verificado) para `vianamidias.com.br` (verificado no Resend).

---

## Alteracoes Necessarias

| Arquivo | Linha | Antes | Depois |
|---------|-------|-------|--------|
| `send-email-change/index.ts` | 102 | `MetrikaPRO <noreply@metrikapro.com.br>` | `MetrikaPRO <noreply@vianamidias.com.br>` |
| `send-password-reset/index.ts` | 89 | `MetrikaPRO <noreply@metrikapro.com.br>` | `MetrikaPRO <noreply@vianamidias.com.br>` |

---

## Resultado

Os emails continuarao sendo enviados com o nome "MetrikaPRO", mas usando o dominio verificado `vianamidias.com.br`:

```text
De: MetrikaPRO <noreply@vianamidias.com.br>
Para: usuario@exemplo.com
Assunto: Confirme seu novo email - MetrikaPRO
```

---

## Arquivos a Modificar

| Arquivo | Tipo |
|---------|------|
| `supabase/functions/send-email-change/index.ts` | Editar |
| `supabase/functions/send-password-reset/index.ts` | Editar |

