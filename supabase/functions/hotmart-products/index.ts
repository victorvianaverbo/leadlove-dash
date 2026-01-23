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

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await supabaseAuth.auth.getClaims(token);

    if (authError || !claimsData?.claims) {
      console.error('Auth error:', authError?.message || 'No claims found');
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const { project_id } = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof project_id !== 'string' || !uuidRegex.test(project_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid project_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Hotmart integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('project_id', project_id)
      .eq('type', 'hotmart')
      .eq('is_active', true)
      .single();

    if (!integration) {
      return new Response(
        JSON.stringify({ error: 'Hotmart integration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { client_id, client_secret, basic_token } = integration.credentials as {
      client_id: string;
      client_secret: string;
      basic_token: string;
    };

    console.log('Fetching Hotmart access token...');

    // Get access token from Hotmart
    const tokenResponse = await fetch('https://api-sec-vlc.hotmart.com/security/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basic_token}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id,
        client_secret,
      }).toString(),
    });

    console.log(`Hotmart token response status: ${tokenResponse.status}`);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Hotmart token error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with Hotmart' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('Fetching Hotmart products...');

    // Fetch products from Hotmart
    const productsResponse = await fetch('https://developers.hotmart.com/products/api/v1/products?max_results=100', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Hotmart products response status: ${productsResponse.status}`);

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error('Hotmart products error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch products from Hotmart' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productsData = await productsResponse.json();
    const products = productsData.items || [];

    console.log(`Fetched ${products.length} products from Hotmart`);

    // Map to standardized format
    const mappedProducts = products.map((product: any) => ({
      id: product.id?.toString() || product.product_id?.toString(),
      name: product.name || product.product_name,
      status: product.status,
      price: product.price || 0,
    }));

    return new Response(
      JSON.stringify({ products: mappedProducts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in hotmart-products:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
