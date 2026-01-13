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
    
    // Create a client with anon key for auth verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    // Create a client with service role for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use getClaims to verify the user token
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

    // Calculate date range: last 90 days
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    const since = ninetyDaysAgo.toISOString().split('T')[0];
    const until = today.toISOString().split('T')[0];

    console.log(`Fetching campaigns with activity from ${since} to ${until}`);

    // First, fetch all campaigns to get their names and status
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${ad_account_id}/campaigns?fields=id,name,status,effective_status&limit=500&access_token=${access_token}`
    );

    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text();
      console.error('Meta campaigns error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Meta campaigns', details: errorText, campaigns: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const campaignsData = await campaignsResponse.json();
    const allCampaigns = campaignsData.data || [];

    // Then, fetch insights to see which campaigns had activity in the last 90 days
    const insightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${ad_account_id}/insights?fields=campaign_id,campaign_name,spend,impressions&time_range={"since":"${since}","until":"${until}"}&level=campaign&limit=500&access_token=${access_token}`
    );

    let campaignsWithActivity: string[] = [];
    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json();
      campaignsWithActivity = (insightsData.data || []).map((i: { campaign_id: string }) => i.campaign_id);
      console.log(`Found ${campaignsWithActivity.length} campaigns with activity in last 90 days`);
    } else {
      console.log('Could not fetch insights, returning all campaigns');
    }

    // Merge: mark campaigns that had activity
    const enrichedCampaigns = allCampaigns.map((campaign: { id: string; name: string; status: string; effective_status?: string }) => ({
      ...campaign,
      had_recent_activity: campaignsWithActivity.includes(campaign.id),
    }));

    // Sort: campaigns with activity first, then by status (ACTIVE first)
    enrichedCampaigns.sort((a: { had_recent_activity: boolean; status: string }, b: { had_recent_activity: boolean; status: string }) => {
      if (a.had_recent_activity !== b.had_recent_activity) {
        return a.had_recent_activity ? -1 : 1;
      }
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
      return 0;
    });

    console.log(`Returning ${enrichedCampaigns.length} total campaigns for project: ${project_id}`);

    return new Response(
      JSON.stringify({ 
        campaigns: enrichedCampaigns,
        date_range: { since, until }
      }),
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
