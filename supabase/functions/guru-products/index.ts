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

    // Get Guru integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('project_id', project_id)
      .eq('type', 'guru')
      .eq('is_active', true)
      .single();

    if (!integration) {
      return new Response(
        JSON.stringify({ error: 'Guru integration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { api_token } = integration.credentials as { api_token: string };

    console.log('Fetching Guru products...');

    // Fetch products from Guru DMG - API v2
    const productsResponse = await fetch('https://digitalmanager.guru/api/v2/products', {
      headers: {
        'Authorization': `Bearer ${api_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log(`Guru products response status: ${productsResponse.status}`);

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error('Guru products error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch products from Guru' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productsData = await productsResponse.json();
    const products = productsData.data || productsData.products || productsData || [];

    console.log(`Fetched ${Array.isArray(products) ? products.length : 0} products from Guru`);

    // Map to standardized format
    const mappedProducts = Array.isArray(products) ? products.map((product: any) => ({
      id: product.id?.toString() || product.product_id?.toString(),
      name: product.name || product.title || product.product_name,
      status: product.status || 'active',
      price: product.price || product.value || 0,
    })) : [];

    return new Response(
      JSON.stringify({ products: mappedProducts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in guru-products:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
