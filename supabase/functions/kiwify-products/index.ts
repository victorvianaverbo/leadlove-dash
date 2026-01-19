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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's auth header for authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Create a client with service role for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate user token by getting user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the project before accessing integrations
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    const { client_id, client_secret, account_id } = integration.credentials as { client_id: string; client_secret: string; account_id: string };

    // Get access token from Kiwify
    const tokenResponse = await fetch('https://public-api.kiwify.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id,
        client_secret,
      }).toString(),
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
    const productsResponse = await fetch('https://public-api.kiwify.com/v1/products', {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'x-kiwify-account-id': account_id
      },
    });

    if (!productsResponse.ok) {
      console.error('Kiwify products error:', await productsResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Kiwify products', products: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productsData = await productsResponse.json();
    
    // LOGS DETALHADOS PARA DEBUG
    console.log('=== KIWIFY DEBUG ===');
    console.log('Account ID usado:', account_id);
    console.log('Response status:', productsResponse.status);
    console.log('Full response data:', JSON.stringify(productsData));
    console.log('Response keys:', Object.keys(productsData));
    if (productsData.data) {
      console.log('productsData.data length:', productsData.data.length);
    }
    if (productsData.products) {
      console.log('productsData.products length:', productsData.products.length);
    }
    console.log('=== END DEBUG ===');
    
    console.log('Fetched Kiwify products for project:', project_id);

    // Tentar diferentes estruturas de resposta
    const products = productsData.data 
      || productsData.products 
      || (Array.isArray(productsData) ? productsData : []);

    return new Response(
      JSON.stringify({ 
        products,
        debug: {
          keys: Object.keys(productsData),
          hasData: !!productsData.data,
          hasProducts: !!productsData.products,
          isArray: Array.isArray(productsData)
        }
      }),
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
