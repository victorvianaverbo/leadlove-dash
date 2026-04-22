// Defensive guard: detects missing Supabase env vars at app boot and
// renders a friendly error screen instead of letting createClient throw
// synchronously (which would result in a blank white page).

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function checkSupabaseEnv(): boolean {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
  if (!SUPABASE_PUBLISHABLE_KEY) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length === 0) return true;

  // Log with clear context for debugging
  console.error(
    "[MetrikaPRO] Configuração do backend ausente no bundle. Variáveis faltando:",
    missing,
  );

  // Render friendly error screen directly into #root
  if (typeof document !== "undefined") {
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0F172A;color:#F1F5F9;font-family:Inter,system-ui,sans-serif;padding:24px;">
          <div style="max-width:480px;text-align:center;background:#1E293B;border:1px solid #334155;border-radius:12px;padding:40px;box-shadow:0 10px 40px rgba(0,0,0,0.4);">
            <div style="width:56px;height:56px;border-radius:50%;background:#8B5CF6;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:28px;">⚙️</div>
            <h1 style="font-size:20px;font-weight:600;margin:0 0 12px;font-family:Poppins,Inter,sans-serif;">Configuração indisponível</h1>
            <p style="font-size:14px;color:#94A3B8;margin:0 0 24px;line-height:1.5;">
              A aplicação não conseguiu carregar a configuração do backend. Isso geralmente é resolvido recarregando a página.
            </p>
            <button
              onclick="window.location.reload()"
              style="background:#8B5CF6;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;"
              onmouseover="this.style.background='#7C3AED'"
              onmouseout="this.style.background='#8B5CF6'"
            >
              Recarregar página
            </button>
            <p style="font-size:12px;color:#64748B;margin:20px 0 0;">
              Se o problema persistir, entre em contato com o suporte:<br/>
              <a href="https://wa.me/5531991618745" style="color:#8B5CF6;text-decoration:none;">WhatsApp +55 31 99161-8745</a>
            </p>
          </div>
        </div>
      `;
    }
  }

  return false;
}
