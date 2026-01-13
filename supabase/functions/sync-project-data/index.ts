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

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
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

      // Get access token
      const tokenResponse = await fetch('https://public-api.kiwify.com/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id,
          client_secret,
        }),
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Determine start date: use last_sync_at or 90 days ago
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const startDate = project.last_sync_at 
          ? new Date(project.last_sync_at) 
          : ninetyDaysAgo;

        console.log(`Syncing sales from ${startDate.toISOString()}`);

        // Fetch sales with date filter
        const params = new URLSearchParams({
          created_at_min: startDate.toISOString(),
          limit: '100'
        });

        const salesResponse = await fetch(`https://public-api.kiwify.com/v1/sales?${params}`, {
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
                user_id: user.id,
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

      for (const campaignId of project.meta_campaign_ids) {
        // Removed landing_page_views from direct fields - it comes from actions array
        const insightsUrl = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,clicks,reach,frequency,cpc,cpm,inline_link_clicks,actions&time_range={"since":"${since}","until":"${until}"}&level=ad&time_increment=1&access_token=${access_token}`;
        
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
          // Extract landing_page_views from actions array
          const actions = insight.actions || [];
          const landingPageViewAction = actions.find(
            (a: { action_type: string }) => a.action_type === 'landing_page_view'
          );
          const landingPageViews = landingPageViewAction 
            ? parseInt(landingPageViewAction.value || '0') 
            : 0;

          console.log(`Upserting insight: date=${insight.date_start}, spend=${insight.spend}, campaign=${insight.campaign_name}, lpViews=${landingPageViews}`);
          
          const { error: upsertError } = await supabase
            .from('ad_spend')
            .upsert({
              project_id: project.id,
              user_id: user.id,
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