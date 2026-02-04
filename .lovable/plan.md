

# Sistema de Recuperacao de Senha e Gerenciamento de Conta

## Visao Geral

Implementar um sistema completo de:
1. **Recuperacao de senha** - Envio de email com link de reset via Resend
2. **Redefinicao de senha** - Pagina para definir nova senha
3. **Pagina de configuracoes do usuario** - Alterar email, nome e senha

---

## Arquitetura do Fluxo

```text
RECUPERAR SENHA:
┌─────────────────────────────────────────────────────────────────────┐
│  /auth (link "Esqueci minha senha")                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  /forgot-password (formulario com email)                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Edge Function: send-password-reset                                │
│  - Gera token via Supabase Auth                                    │
│  - Envia email via Resend com link de reset                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  /reset-password?token=xxx (formulario nova senha)                 │
│  - Valida token                                                    │
│  - Atualiza senha via Supabase Auth                                │
└─────────────────────────────────────────────────────────────────────┘


ALTERAR DADOS DA CONTA:
┌─────────────────────────────────────────────────────────────────────┐
│  /settings (nova pagina)                                           │
│  - Alterar nome                                                    │
│  - Alterar email (requer confirmacao)                              │
│  - Alterar senha (requer senha atual)                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Componentes a Criar

### 1. Edge Function: send-password-reset

| Campo | Valor |
|-------|-------|
| Caminho | `supabase/functions/send-password-reset/index.ts` |
| Metodo | POST |
| Body | `{ email: string }` |
| Acao | Gera link de reset e envia via Resend |

### 2. Novas Paginas

| Pagina | Rota | Descricao |
|--------|------|-----------|
| ForgotPassword | `/forgot-password` | Formulario para solicitar reset |
| ResetPassword | `/reset-password` | Formulario para definir nova senha |
| Settings | `/settings` | Configuracoes da conta do usuario |

---

## Alteracoes Necessarias

### Backend (Edge Functions)

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/send-password-reset/index.ts` | **Novo** - Envia email de recuperacao via Resend |
| `supabase/config.toml` | Adicionar configuracao da nova funcao |

### Frontend (Paginas)

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/ForgotPassword.tsx` | **Novo** - Formulario para solicitar reset de senha |
| `src/pages/ResetPassword.tsx` | **Novo** - Formulario para definir nova senha |
| `src/pages/Settings.tsx` | **Novo** - Pagina de configuracoes da conta |
| `src/pages/Auth.tsx` | Adicionar link "Esqueci minha senha" |
| `src/App.tsx` | Adicionar novas rotas |

---

## Pre-requisito: API Key do Resend

Antes de implementar, sera necessario configurar o secret `RESEND_API_KEY`:

- Criar conta em https://resend.com (se ainda nao tiver)
- Validar dominio em https://resend.com/domains
- Criar API key em https://resend.com/api-keys
- Adicionar o secret no projeto

---

## Secao Tecnica

### Edge Function: send-password-reset

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Gerar link de reset via Supabase
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${req.headers.get("origin")}/reset-password`,
      },
    });

    if (error) throw error;

    // Enviar email via Resend
    await resend.emails.send({
      from: "MetrikaPRO <noreply@SEU-DOMINIO.com>",
      to: [email],
      subject: "Recupere sua senha - MetrikaPRO",
      html: `
        <h1>Recuperacao de Senha</h1>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${data.properties.action_link}">Redefinir Senha</a>
        <p>Este link expira em 1 hora.</p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### Pagina Settings - Funcionalidades

```typescript
// Alterar nome
await supabase.from('profiles').update({ full_name: newName }).eq('user_id', user.id);

// Alterar email
await supabase.auth.updateUser({ email: newEmail });
// Usuario recebe email de confirmacao

// Alterar senha
await supabase.auth.updateUser({ password: newPassword });
```

### Pagina Reset Password

```typescript
// Quando o usuario clica no link do email, Supabase seta a sessao automaticamente
// Basta verificar se ha sessao e permitir alterar a senha

const { data: { session } } = await supabase.auth.getSession();
if (session) {
  await supabase.auth.updateUser({ password: newPassword });
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `supabase/functions/send-password-reset/index.ts` | Novo | Edge function para envio de email |
| `supabase/config.toml` | Editar | Adicionar config da nova funcao |
| `src/pages/ForgotPassword.tsx` | Novo | Solicitar reset de senha |
| `src/pages/ResetPassword.tsx` | Novo | Definir nova senha |
| `src/pages/Settings.tsx` | Novo | Configuracoes da conta |
| `src/pages/Auth.tsx` | Editar | Adicionar link "Esqueci senha" |
| `src/App.tsx` | Editar | Adicionar novas rotas |
| `src/pages/Dashboard.tsx` | Editar | Adicionar link para Settings no header |

---

## Resultado Esperado

| Funcionalidade | Status |
|----------------|--------|
| Link "Esqueci minha senha" na pagina de login | Novo |
| Formulario para solicitar reset de senha | Novo |
| Email enviado via Resend com link de recuperacao | Novo |
| Pagina para definir nova senha | Novo |
| Pagina de configuracoes da conta | Novo |
| Alterar nome do usuario | Novo |
| Alterar email (com confirmacao) | Novo |
| Alterar senha (requer senha atual) | Novo |

