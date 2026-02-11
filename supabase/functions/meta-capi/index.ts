const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const pixelId = Deno.env.get("META_PIXEL_ID");
    const accessToken = Deno.env.get("META_PIXEL_ACCESS_TOKEN");

    if (!pixelId || !accessToken) {
      throw new Error("META_PIXEL_ID or META_PIXEL_ACCESS_TOKEN not configured");
    }

    const { event_name, event_id, value, currency, user_agent, source_url } = await req.json();

    if (!event_name || !event_id) {
      throw new Error("event_name and event_id are required");
    }

    const eventData: Record<string, unknown> = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      action_source: "website",
      event_source_url: source_url || undefined,
      user_data: {
        client_user_agent: user_agent || req.headers.get("user-agent") || "",
        client_ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
      },
    };

    if (value && currency) {
      eventData.custom_data = { value: Number(value), currency };
    }

    const payload = { data: [eventData] };

    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("[META-CAPI]", event_name, event_id, JSON.stringify(result));

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[META-CAPI] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
