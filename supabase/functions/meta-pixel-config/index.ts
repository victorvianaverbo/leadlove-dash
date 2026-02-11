const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const pixelId = Deno.env.get("META_PIXEL_ID") || "";

  return new Response(JSON.stringify({ pixelId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
