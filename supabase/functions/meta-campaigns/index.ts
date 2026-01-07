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

    // Fetch Meta credentials for this project
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('project_id', project_id)
      .eq('type', 'meta_ads')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Meta Ads integration not found for this project', campaigns: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token, ad_account_id } = integration.credentials as { access_token: string; ad_account_id: string };

    // Fetch campaigns from Meta
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${ad_account_id}/campaigns?fields=id,name,status&access_token=${access_token}`
    );

    if (!campaignsResponse.ok) {
      console.error('Meta campaigns error:', await campaignsResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Meta campaigns', campaigns: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const campaignsData = await campaignsResponse.json();
    console.log('Fetched Meta campaigns for project:', project_id);

    return new Response(
      JSON.stringify({ campaigns: campaignsData.data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in meta-campaigns:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, campaigns: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
