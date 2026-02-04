

# Email Personalizado para Confirmacao de Email

## Objetivo

Substituir o email padrao do Supabase Auth por um email customizado via Resend quando o usuario solicita alteracao de email, seguindo o mesmo design visual do email de recuperacao de senha.

---

## Situacao Atual

| Funcionalidade | Servico | Template |
|----------------|---------|----------|
| Recuperacao de senha | Resend | HTML customizado com branding MetrikaPRO |
| Alteracao de email | Supabase Auth | Template padrao do Supabase |

---

## Solucao Proposta

Criar uma nova Edge Function que gera o link de confirmacao e envia via Resend com template personalizado.

```text
FLUXO ATUAL:
┌─────────────────────────────────────────────────────────────────────┐
│  Settings.tsx                                                      │
│  supabase.auth.updateUser({ email })                               │
│  → Supabase envia email padrao automaticamente                     │
└─────────────────────────────────────────────────────────────────────┘

NOVO FLUXO:
┌─────────────────────────────────────────────────────────────────────┐
│  Settings.tsx                                                      │
│  supabase.functions.invoke('send-email-change')                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Edge Function: send-email-change                                  │
│  - Gera link via admin.generateLink({ type: 'email_change_new' })  │
│  - Envia email customizado via Resend                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Usuario recebe email bonito com link de confirmacao               │
│  → Clica e confirma a alteracao                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Alteracoes Necessarias

### 1. Nova Edge Function

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/send-email-change/index.ts` | Gera link de confirmacao e envia email via Resend |

**Funcionalidade:**
- Recebe `currentEmail`, `newEmail` e `redirectUrl`
- Usa `supabaseAdmin.auth.admin.generateLink({ type: 'email_change_new' })`
- Envia email para o **novo endereco** com template identico ao de recuperacao de senha

### 2. Atualizar Config

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/config.toml` | Adicionar configuracao da nova funcao |

### 3. Atualizar Settings.tsx

| Alteracao | Descricao |
|-----------|-----------|
| Remover | `supabase.auth.updateUser({ email })` |
| Adicionar | `supabase.functions.invoke('send-email-change', { body: { currentEmail, newEmail } })` |

---

## Template do Email

O email de confirmacao tera o mesmo estilo visual do email de recuperacao:

- Header com logo MetrikaPRO (gradiente roxo)
- Titulo "Confirmacao de Email"
- Texto explicativo
- Botao "Confirmar Novo Email"
- Informacoes de seguranca
- Link alternativo no rodape

---

## Secao Tecnica

### Edge Function: send-email-change

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // ... CORS handling ...

  const { currentEmail, newEmail, redirectUrl } = await req.json();

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Gerar link de confirmacao para o novo email
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "email_change_new",
    email: currentEmail,
    newEmail: newEmail,
    options: {
      redirectTo: redirectUrl || "https://metrikapro.com.br/settings",
    },
  });

  // Enviar email via Resend
  await resend.emails.send({
    from: "MetrikaPRO <noreply@metrikapro.com.br>",
    to: [newEmail],
    subject: "Confirme seu novo email - MetrikaPRO",
    html: `
      <!-- Template identico ao de recuperacao de senha -->
      <!-- Com titulo "Confirmacao de Email" -->
      <!-- E botao "Confirmar Novo Email" -->
    `,
  });
});
```

### Atualizacao no Settings.tsx

```typescript
const handleUpdateEmail = async (e: React.FormEvent) => {
  e.preventDefault();
  
  setIsUpdatingEmail(true);
  try {
    const { error } = await supabase.functions.invoke('send-email-change', {
      body: {
        currentEmail: user!.email,
        newEmail: newEmail.trim(),
        redirectUrl: window.location.origin + '/settings',
      },
    });

    if (error) throw error;

    toast({
      title: 'Email de confirmacao enviado!',
      description: 'Verifique a caixa de entrada do novo email.',
    });
    setNewEmail('');
  } catch (error: any) {
    // ... error handling ...
  } finally {
    setIsUpdatingEmail(false);
  }
};
```

---

## Arquivos a Criar/Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `supabase/functions/send-email-change/index.ts` | Novo | Edge function para envio de email de confirmacao |
| `supabase/config.toml` | Editar | Adicionar config da nova funcao |
| `src/pages/Settings.tsx` | Editar | Usar Edge Function ao inves do updateUser |

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Email padrao do Supabase | Email customizado MetrikaPRO |
| Template generico | Design consistente com a marca |
| Sem branding | Logo, cores e estilo da aplicacao |

