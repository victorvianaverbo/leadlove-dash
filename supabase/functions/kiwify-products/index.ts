import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('user_id', user.id)
      .eq('type', 'kiwify')
      .eq('is_active', true)
      .single();

    if (!integration) throw new Error('Kiwify not connected');

    const creds = integration.credentials as { client_id: string; client_secret: string };

    const tokenRes = await fetch('https://api.kiwify.com.br/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: creds.client_id,
        client_secret: creds.client_secret,
      }),
    });

    if (!tokenRes.ok) throw new Error('Failed to get Kiwify token');
    const { access_token } = await tokenRes.json();

    const productsRes = await fetch('https://api.kiwify.com.br/v1/products', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!productsRes.ok) throw new Error('Failed to fetch products');
    const { data: products } = await productsRes.json();

    return new Response(
      JSON.stringify({ products: products || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const error = err as Error;
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, products: [] }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
