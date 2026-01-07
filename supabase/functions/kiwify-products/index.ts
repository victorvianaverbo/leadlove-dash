import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch Kiwify credentials for this project
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('project_id', project_id)
      .eq('type', 'kiwify')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Kiwify integration not found for this project', products: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { client_id, client_secret } = integration.credentials as { client_id: string; client_secret: string };

    // Get access token from Kiwify
    const tokenResponse = await fetch('https://api.kiwify.com.br/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id,
        client_secret,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Kiwify token error:', await tokenResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to get Kiwify access token', products: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch products from Kiwify
    const productsResponse = await fetch('https://api.kiwify.com.br/v1/products', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!productsResponse.ok) {
      console.error('Kiwify products error:', await productsResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Kiwify products', products: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productsData = await productsResponse.json();
    console.log('Fetched Kiwify products for project:', project_id);

    return new Response(
      JSON.stringify({ products: productsData.data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in kiwify-products:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, products: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
