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
    
    // Validate project_id is provided
    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate project_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof project_id !== 'string' || !uuidRegex.test(project_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid project_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch integrations for this project
    const { data: integrations } = await supabase
      .from('integrations')
      .select('*')
      .eq('project_id', project_id)
      .eq('is_active', true);

    const kiwifyIntegration = integrations?.find(i => i.type === 'kiwify');
    const metaIntegration = integrations?.find(i => i.type === 'meta_ads');

    let salesSynced = 0;
    let adSpendSynced = 0;

    // Sync Kiwify sales
    if (kiwifyIntegration && project.kiwify_product_ids?.length > 0) {
      const { client_id, client_secret, account_id } = kiwifyIntegration.credentials as { 
        client_id: string; 
        client_secret: string; 
        account_id: string;
      };

      // Get access token - Kiwify requires form-urlencoded format
      const tokenResponse = await fetch('https://public-api.kiwify.com/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id,
          client_secret,
        }).toString(),
      });

      console.log(`Kiwify token request status: ${tokenResponse.status}`);

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Determine start date: use last_sync_at or 90 days ago
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const startDate = project.last_sync_at 
          ? new Date(project.last_sync_at) 
          : ninetyDaysAgo;

        // Format dates as YYYY-MM-DD for Kiwify API v1
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = new Date().toISOString().split('T')[0];
        console.log(`Syncing sales from ${formattedStartDate} to ${formattedEndDate}`);

        // Fetch sales with correct Kiwify API v1 parameters
        // Endpoint is /v1/sales (not /orders), requires both start_date and end_date
        const params = new URLSearchParams({
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          page_size: '100'
        });

        const salesUrl = `https://public-api.kiwify.com/v1/sales?${params.toString()}`;
        console.log(`Fetching sales from URL: ${salesUrl}`);

        const salesResponse = await fetch(salesUrl, {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'x-kiwify-account-id': account_id
          },
        });

        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          const sales = salesData.data || [];

          console.log(`Fetched ${sales.length} sales from Kiwify`);

          // Filter by selected product IDs
          const filteredSales = sales.filter((sale: { product_id: string }) => 
            project.kiwify_product_ids.includes(sale.product_id)
          );

          console.log(`${filteredSales.length} sales match selected products`);

          for (const sale of filteredSales) {
            const tracking = sale.tracking || {};
            const { error: upsertError } = await supabase
              .from('sales')
              .upsert({
                kiwify_sale_id: sale.id,
                project_id: project.id,
                user_id: userId,
                product_id: sale.product_id,
                product_name: sale.product_name,
                amount: (sale.amount || 0) / 100,
                status: sale.status,
                payment_method: sale.payment_method,
                customer_name: sale.customer?.name,
                customer_email: sale.customer?.email,
                sale_date: sale.created_at,
                utm_source: tracking.utm_source,
                utm_medium: tracking.utm_medium,
                utm_campaign: tracking.utm_campaign,
                utm_content: tracking.utm_content,
                utm_term: tracking.utm_term,
              }, { onConflict: 'kiwify_sale_id' });

            if (!upsertError) salesSynced++;
          }
        } else {
          console.error('Failed to fetch sales:', await salesResponse.text());
        }
      } else {
        console.error('Failed to get access token:', await tokenResponse.text());
      }
    }

    // Sync Meta Ads spend
    if (metaIntegration && project.meta_campaign_ids?.length > 0) {
      const { access_token, ad_account_id } = metaIntegration.credentials as { access_token: string; ad_account_id: string };

      console.log(`Starting Meta Ads sync for project ${project_id}`);
      console.log(`Ad Account: ${ad_account_id}`);
      console.log(`Campaign IDs to sync: ${project.meta_campaign_ids.join(', ')}`);

      // Calculate date range (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const since = thirtyDaysAgo.toISOString().split('T')[0];
      const until = today.toISOString().split('T')[0];

      console.log(`Date range: ${since} to ${until}`);

      // Fetch daily_budget for each campaign
      const campaignBudgets: Record<string, number> = {};
      for (const campaignId of project.meta_campaign_ids) {
        try {
          const campaignUrl = `https://graph.facebook.com/v18.0/${campaignId}?fields=daily_budget&access_token=${access_token}`;
          const campaignResponse = await fetch(campaignUrl);
          if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
            // daily_budget comes in cents from Meta API
            campaignBudgets[campaignId] = campaignData.daily_budget ? parseFloat(campaignData.daily_budget) / 100 : 0;
            console.log(`Campaign ${campaignId} daily budget: ${campaignBudgets[campaignId]}`);
          }
        } catch (e) {
          console.error(`Failed to fetch budget for campaign ${campaignId}:`, e);
        }
      }

      for (const campaignId of project.meta_campaign_ids) {
        const insightsUrl = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,clicks,reach,frequency,cpc,cpm,inline_link_clicks,actions,video_thruplay_watched_actions,video_p25_watched_actions&time_range={"since":"${since}","until":"${until}"}&level=ad&time_increment=1&access_token=${access_token}`;
        
        console.log(`Fetching insights for campaign ${campaignId}`);
        
        const insightsResponse = await fetch(insightsUrl);
        const responseText = await insightsResponse.text();

        if (!insightsResponse.ok) {
          console.error(`Meta API error for campaign ${campaignId}:`, responseText);
          continue;
        }

        let insightsData;
        try {
          insightsData = JSON.parse(responseText);
        } catch (e) {
          console.error(`Failed to parse Meta response for campaign ${campaignId}:`, responseText);
          continue;
        }

        const insights = insightsData.data || [];
        console.log(`Got ${insights.length} insights for campaign ${campaignId}`);

        if (insights.length === 0) {
          console.log(`No insights data for campaign ${campaignId} in the date range`);
        }

        for (const insight of insights) {
          // Extract metrics from actions array
          const actions = insight.actions || [];
          const landingPageViewAction = actions.find(
            (a: { action_type: string }) => a.action_type === 'landing_page_view'
          );
          const landingPageViews = landingPageViewAction 
            ? parseInt(landingPageViewAction.value || '0') 
            : 0;

          // Extract initiate_checkout from actions
          const initiateCheckoutAction = actions.find(
            (a: { action_type: string }) => a.action_type === 'initiate_checkout'
          );
          const checkoutsInitiated = initiateCheckoutAction 
            ? parseInt(initiateCheckoutAction.value || '0') 
            : 0;

          // Extract ThruPlays from video_thruplay_watched_actions
          const thruplayActions = insight.video_thruplay_watched_actions || [];
          const thruplayAction = thruplayActions.find(
            (a: { action_type: string }) => a.action_type === 'video_view'
          );
          const thruplays = thruplayAction 
            ? parseInt(thruplayAction.value || '0') 
            : 0;

          // Extract 3-second video views from video_p25_watched_actions (approximation for hook)
          const video3sActions = insight.video_p25_watched_actions || [];
          const video3sAction = video3sActions.find(
            (a: { action_type: string }) => a.action_type === 'video_view'
          );
          const video3sViews = video3sAction 
            ? parseInt(video3sAction.value || '0') 
            : 0;

          console.log(`Upserting insight: date=${insight.date_start}, spend=${insight.spend}, campaign=${insight.campaign_name}, lpViews=${landingPageViews}, checkouts=${checkoutsInitiated}, thruplays=${thruplays}, 3s=${video3sViews}`);
          
          const { error: upsertError } = await supabase
            .from('ad_spend')
            .upsert({
              project_id: project.id,
              user_id: userId,
              campaign_id: insight.campaign_id,
              campaign_name: insight.campaign_name,
              adset_id: insight.adset_id,
              adset_name: insight.adset_name,
              ad_id: insight.ad_id,
              ad_name: insight.ad_name,
              spend: parseFloat(insight.spend || '0'),
              impressions: parseInt(insight.impressions || '0'),
              clicks: parseInt(insight.clicks || '0'),
              reach: parseInt(insight.reach || '0'),
              frequency: parseFloat(insight.frequency || '0'),
              cpc: parseFloat(insight.cpc || '0'),
              cpm: parseFloat(insight.cpm || '0'),
              link_clicks: parseInt(insight.inline_link_clicks || '0'),
              landing_page_views: landingPageViews,
              daily_budget: campaignBudgets[campaignId] || 0,
              checkouts_initiated: checkoutsInitiated,
              thruplays: thruplays,
              video_3s_views: video3sViews,
              date: insight.date_start,
            }, { onConflict: 'campaign_id,date,project_id' });

          if (upsertError) {
            console.error(`Failed to upsert insight:`, upsertError);
          } else {
            adSpendSynced++;
          }
        }
      }
    } else {
      if (!metaIntegration) {
        console.log('No active Meta integration found for this project');
      } else if (!project.meta_campaign_ids?.length) {
        console.log('No campaign IDs selected for this project');
      }
    }

    // Update last_sync_at
    await supabase
      .from('projects')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', project_id);

    console.log(`Synced ${salesSynced} sales and ${adSpendSynced} ad spend records for project ${project_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        salesSynced, 
        adSpendSynced 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-project-data:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});