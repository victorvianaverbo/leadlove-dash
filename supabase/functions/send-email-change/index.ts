import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailChangeRequest {
  currentEmail: string;
  newEmail: string;
  redirectUrl?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentEmail, newEmail, redirectUrl }: EmailChangeRequest = await req.json();

    // Validate required fields
    if (!currentEmail || !newEmail) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Email atual e novo email são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      console.error("Invalid email format");
      return new Response(
        JSON.stringify({ error: "Formato de email inválido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing email change request from ${currentEmail} to ${newEmail}`);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the origin from the request or use the redirect URL
    const finalRedirectUrl = redirectUrl || "https://metrikapro.com.br/settings";

    console.log(`Redirect URL: ${finalRedirectUrl}`);

    // Generate email change link via Supabase Auth Admin
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "email_change_new",
      email: currentEmail,
      newEmail: newEmail,
      options: {
        redirectTo: finalRedirectUrl,
      },
    });

    if (error) {
      console.error("Supabase generateLink error:", error);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar link de confirmação" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!data?.properties?.action_link) {
      console.error("No action link generated");
      return new Response(
        JSON.stringify({ error: "Erro ao gerar link de confirmação" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Email change link generated successfully");

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "MetrikaPRO <noreply@vianamidias.com.br>",
      to: [newEmail],
      subject: "Confirme seu novo email - MetrikaPRO",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); padding: 12px; border-radius: 12px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <h1 style="color: #18181b; font-size: 24px; font-weight: 700; margin: 16px 0 0 0;">MetrikaPRO</h1>
            </div>
            
            <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">Confirmação de Email</h2>
            
            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Você solicitou a alteração do email da sua conta para <strong>${newEmail}</strong>. Clique no botão abaixo para confirmar esta alteração:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${data.properties.action_link}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Confirmar Novo Email
              </a>
            </div>
            
            <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
              Se você não solicitou esta alteração, pode ignorar este email com segurança. Sua conta permanecerá com o email atual.
            </p>
            
            <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 0;">
              Este link expira em <strong>1 hora</strong>.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
            
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${data.properties.action_link}" style="color: #8b5cf6; word-break: break-all;">${data.properties.action_link}</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email change confirmation sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-change function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
