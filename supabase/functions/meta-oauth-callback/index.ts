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

  console.log("[meta-oauth-callback] Received callback", { code: !!code, state, error });

  if (error) {
    console.error("[meta-oauth-callback] Facebook returned error:", error);
    return redirectWithError(state, `Facebook error: ${error}`);
  }

  if (!code || !state) {
    console.error("[meta-oauth-callback] Missing code or state");
    return redirectWithError(state, "Missing code or state");
  }

  const [projectId, userId] = state.split("|");
  if (!projectId || !userId) {
    console.error("[meta-oauth-callback] Invalid state format");
    return redirectWithError(state, "Invalid state");
  }

  try {
    const META_APP_ID = Deno.env.get("META_APP_ID");
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!META_APP_ID || !META_APP_SECRET) {
      throw new Error("META_APP_ID or META_APP_SECRET not configured");
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`;

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

    // Step 5: Redirect back to project edit page
    const appUrl = getAppRedirectUrl(state, "success");
    console.log("[meta-oauth-callback] Redirecting to:", appUrl);
    return new Response(null, {
      status: 302,
      headers: { Location: appUrl },
    });
  } catch (err) {
    console.error("[meta-oauth-callback] Error:", err);
    return redirectWithError(state, (err as Error).message);
  }
});

function getAppRedirectUrl(state: string | null, status: string, message?: string): string {
  const projectId = state?.split("|")[0] || "";
  const baseUrl = "https://metrikapro.com.br";
  const params = new URLSearchParams({ meta_oauth: status });
  if (message) params.set("meta_oauth_error", message);
  return `${baseUrl}/projeto/${projectId}/editar?${params.toString()}`;
}

function redirectWithError(state: string | null, message: string): Response {
  const url = getAppRedirectUrl(state, "error", message);
  return new Response(null, {
    status: 302,
    headers: { Location: url },
  });
}
