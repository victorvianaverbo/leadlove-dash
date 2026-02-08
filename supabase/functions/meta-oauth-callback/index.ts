import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // POST: return app_id for frontend to build OAuth URL
  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body.action === "get_app_id") {
        const META_APP_ID = Deno.env.get("META_APP_ID");
        if (!META_APP_ID) {
          return new Response(JSON.stringify({ error: "META_APP_ID not configured" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ app_id: META_APP_ID }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      console.error("[meta-oauth-callback] POST error:", e);
    }
    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // GET: handle OAuth callback from Facebook
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  console.log("[meta-oauth-callback] Received callback - URL:", req.url);
  console.log("[meta-oauth-callback] Params:", { code: !!code, state, error });

  if (error) {
    console.error("[meta-oauth-callback] Facebook returned error:", error);
    return popupResponse("error", `Facebook error: ${error}`);
  }

  if (!code || !state) {
    console.error("[meta-oauth-callback] Missing code or state");
    return popupResponse("error", "Missing code or state");
  }

  // State format: projectId|userId|originUrl
  const stateParts = state.split("|");
  const projectId = stateParts[0];
  const userId = stateParts[1];
  const originUrl = stateParts[2] || "https://metrikapro.com.br";

  if (!projectId || !userId) {
    console.error("[meta-oauth-callback] Invalid state format");
    return redirectWithError(state, "Invalid state");
  }

  console.log("[meta-oauth-callback] Parsed state:", { projectId, userId, originUrl });

  try {
    const META_APP_ID = Deno.env.get("META_APP_ID");
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!META_APP_ID || !META_APP_SECRET) {
      throw new Error("META_APP_ID or META_APP_SECRET not configured");
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`;
    console.log("[meta-oauth-callback] redirect_uri used for token exchange:", redirectUri);

    // Step 1: Exchange code for short-lived token
    console.log("[meta-oauth-callback] Exchanging code for short-lived token...");
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${META_APP_SECRET}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("[meta-oauth-callback] Token exchange error:", tokenData.error);
      throw new Error(tokenData.error.message || "Token exchange failed");
    }

    const shortLivedToken = tokenData.access_token;
    console.log("[meta-oauth-callback] Got short-lived token");

    // Step 2: Exchange for long-lived token (60 days)
    console.log("[meta-oauth-callback] Exchanging for long-lived token...");
    const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    if (longLivedData.error) {
      console.error("[meta-oauth-callback] Long-lived token error:", longLivedData.error);
      throw new Error(longLivedData.error.message || "Long-lived token exchange failed");
    }

    const accessToken = longLivedData.access_token;
    console.log("[meta-oauth-callback] Got long-lived token, expires_in:", longLivedData.expires_in);

    // Step 3: Fetch ad accounts
    console.log("[meta-oauth-callback] Fetching ad accounts...");
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`
    );
    const adAccountsData = await adAccountsRes.json();

    if (adAccountsData.error) {
      console.error("[meta-oauth-callback] Ad accounts error:", adAccountsData.error);
      throw new Error(adAccountsData.error.message || "Failed to fetch ad accounts");
    }

    const adAccounts = adAccountsData.data || [];
    console.log("[meta-oauth-callback] Found ad accounts:", adAccounts.length);

    // Use the first active ad account, or first available
    const selectedAdAccount = adAccounts.find((a: { account_status: number }) => a.account_status === 1) || adAccounts[0];
    const adAccountId = selectedAdAccount?.id || "";

    console.log("[meta-oauth-callback] Selected ad account:", adAccountId);

    // Step 4: Save to integrations table
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const credentials = {
      access_token: accessToken,
      ad_account_id: adAccountId,
      oauth_connected: true,
      token_expires_at: new Date(Date.now() + (longLivedData.expires_in || 5184000) * 1000).toISOString(),
      available_ad_accounts: adAccounts.map((a: { id: string; name: string; account_status: number }) => ({
        id: a.id,
        name: a.name,
        account_status: a.account_status,
      })),
    };

    // Check if integration already exists
    const { data: existing } = await supabase
      .from("integrations")
      .select("id")
      .eq("project_id", projectId)
      .eq("type", "meta_ads")
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from("integrations")
        .update({ credentials, is_active: true })
        .eq("id", existing.id);
      if (updateError) throw updateError;
      console.log("[meta-oauth-callback] Updated existing integration");
    } else {
      const { error: insertError } = await supabase
        .from("integrations")
        .insert({
          user_id: userId,
          project_id: projectId,
          type: "meta_ads",
          credentials,
          is_active: true,
        });
      if (insertError) throw insertError;
      console.log("[meta-oauth-callback] Created new integration");
    }

    // Step 5: Return HTML that sends postMessage to opener and closes popup
    console.log("[meta-oauth-callback] Returning success HTML to close popup");
    return popupResponse("success");
  } catch (err) {
    console.error("[meta-oauth-callback] Error:", err);
    return popupResponse("error", (err as Error).message);
  }
});

function popupResponse(type: "success" | "error", message?: string): Response {
  const msgType = type === "success" ? "meta-oauth-success" : "meta-oauth-error";
  const msgJson = JSON.stringify({ type: msgType, ...(message ? { message } : {}) });

  const isSuccess = type === "success";
  const icon = isSuccess
    ? `<div style="width:64px;height:64px;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
       </div>`
    : `<div style="width:64px;height:64px;border-radius:50%;background:#ef4444;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
       </div>`;

  const title = isSuccess ? "Conta conectada com sucesso!" : "Erro na conexão";
  const subtitle = isSuccess
    ? "Pode fechar esta janela e atualizar com F5."
    : `${message || "Ocorreu um erro."} Tente novamente.`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MetrikaPRO OAuth</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;">
<div style="text-align:center;padding:32px;max-width:400px;">
  ${icon}
  <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">${title}</h2>
  <p style="margin:0 0 24px;font-size:14px;color:#64748b;">${subtitle}</p>
  <button onclick="window.close()" style="padding:10px 24px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">Fechar janela</button>
</div>
<script>
  if (window.opener) { window.opener.postMessage(${msgJson}, '*'); }
  setTimeout(function(){ window.close(); }, 100);
</script>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
