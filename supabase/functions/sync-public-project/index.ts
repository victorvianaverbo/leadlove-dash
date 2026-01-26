import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sync configuration
const FIRST_SYNC_DAYS = 90;
const INCREMENTAL_MARGIN_DAYS = 7;

// Helper to get date in Brasília timezone (UTC-3)
function getBrasiliaDate(daysAgo = 0): Date {
  const now = new Date();
  const brasiliaOffset = -3 * 60; // UTC-3 in minutes
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const brasiliaTime = new Date(utcTime + brasiliaOffset * 60000);
  brasiliaTime.setDate(brasiliaTime.getDate() - daysAgo);
  return brasiliaTime;
}

function formatBrasiliaDateString(daysAgo = 0): string {
  return getBrasiliaDate(daysAgo).toISOString().split('T')[0];
}

// Normalize status across platforms
function normalizeStatus(status: string, source: string): string {
  const statusLower = status?.toLowerCase() || '';
  
  // Kiwify statuses
  if (source === 'kiwify') {
    if (statusLower === 'paid') return 'paid';
    if (statusLower === 'refunded' || statusLower === 'charged_back') return 'refunded';
    if (statusLower === 'waiting_payment') return 'pending';
    return 'canceled';
  }
  
  return statusLower;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create a client with service role for all operations (no user auth required)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Fetch project and verify it's public
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Security check: only allow sync for public projects
    if (!project.is_public) {
      return new Response(
        JSON.stringify({ error: 'Project is not public' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Determine sync period based on last_sync_at (using Brasília timezone)
    const isFirstSync = !project.last_sync_at;
    const nowBrasilia = getBrasiliaDate(0);
    
    // Calculate start date for sync (unified for sales and ads)
    let syncStartDate: Date;
    if (isFirstSync) {
      syncStartDate = getBrasiliaDate(FIRST_SYNC_DAYS);
      console.log(`First sync detected - fetching ${FIRST_SYNC_DAYS} days of data (Brasília timezone)`);
    } else {
      // Sync from last_sync - 7 days to catch late confirmations and status changes
      const lastSync = new Date(project.last_sync_at);
      syncStartDate = new Date(lastSync.getTime() - INCREMENTAL_MARGIN_DAYS * 24 * 60 * 60 * 1000);
      console.log(`Incremental sync - fetching data since ${syncStartDate.toISOString()} (Brasília timezone)`);
    }

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

        const formattedStartDate = syncStartDate.toISOString().split('T')[0];
        // Use tomorrow (Brasília) as end_date to ensure today's sales are included
        const endDateObj = getBrasiliaDate(-1); // -1 = tomorrow in Brasília
        const formattedEndDate = endDateObj.toISOString().split('T')[0];

        console.log(`Syncing sales from ${formattedStartDate} to ${formattedEndDate} (using tomorrow to include today's sales)`);

        let allSales: any[] = [];
        
        for (const productId of project.kiwify_product_ids) {
          let pageNumber = 1;
          let hasMorePages = true;
          
          console.log(`Fetching sales for product: ${productId}`);
          
          while (hasMorePages) {
            const params = new URLSearchParams({
              start_date: formattedStartDate,
              end_date: formattedEndDate,
              page_size: '100',
              page_number: pageNumber.toString(),
              product_id: productId,
              view_full_sale_details: 'true',
            });

            const salesUrl = `https://public-api.kiwify.com/v1/sales?${params.toString()}`;
            console.log(`Fetching page ${pageNumber}: ${salesUrl}`);

            const salesResponse = await fetch(salesUrl, {
              headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'x-kiwify-account-id': account_id
              },
            });

            if (salesResponse.ok) {
              const salesData = await salesResponse.json();
              const sales = salesData.data || [];
              
              console.log(`Product ${productId} - Page ${pageNumber}: ${sales.length} sales`);
              
              // Debug log each sale to identify missing ones
              for (const s of sales) {
                console.log(`  - Sale ${s.id}: customer=${s.customer?.name || 'N/A'}, status=${s.status}, date=${s.created_at}, amount=${s.charges?.net_amount || 'N/A'}`);
              }
              
              allSales = allSales.concat(sales);
              
              if (sales.length < 100) {
                hasMorePages = false;
              } else {
                pageNumber++;
              }
            } else {
              const errorText = await salesResponse.text();
              console.error(`Error fetching sales for product ${productId}:`, errorText);
              hasMorePages = false;
            }
          }
        }

        console.log(`Total sales fetched: ${allSales.length}`);

        // Get fixed ticket price if configured
        const ticketPrice = (project as any).kiwify_ticket_price 
          ? parseFloat((project as any).kiwify_ticket_price) 
          : null;
        
        if (ticketPrice) {
          console.log(`Using fixed ticket price for Kiwify: R$ ${ticketPrice}`);
        }

        // Insert sales into database
        for (const sale of allSales) {
          const tracking = sale.tracking || {};
          
          // Valor líquido (parte do produtor após split de coprodução)
          const netAmount = (sale.net_amount || sale.amount || 0) / 100;
          
          // Valor bruto: usar preço fixo se configurado, senão calcular
          let grossAmount: number;
          if (ticketPrice !== null) {
            grossAmount = ticketPrice;
          } else {
            const chargeAmount = sale.payment?.charge_amount || 0;
            const platformFee = sale.payment?.fee || 0;
            grossAmount = chargeAmount > 0 
              ? (chargeAmount - platformFee) / 100 
              : netAmount;
          }
          
          console.log(`Sale ${sale.id}: gross_amount = ${grossAmount} (${ticketPrice ? 'fixed price' : 'calculated'})`);
          
          const { error: upsertError } = await supabase
            .from('sales')
            .upsert({
              kiwify_sale_id: sale.id,
              project_id: project.id,
              user_id: project.user_id,
              product_id: sale.product?.id,
              product_name: sale.product?.name,
              amount: netAmount,
              gross_amount: grossAmount,
              status: normalizeStatus(sale.status, 'kiwify'),
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
        console.error('Failed to get access token:', await tokenResponse.text());
      }
    }

    // Sync Meta Ads spend
    if (metaIntegration && project.meta_campaign_ids?.length > 0) {
      const { access_token, ad_account_id } = metaIntegration.credentials as { access_token: string; ad_account_id: string };

      console.log(`Starting Meta Ads sync for project ${project_id}`);
      console.log(`Campaign IDs to sync: ${project.meta_campaign_ids.join(', ')}`);

      // Use unified syncStartDate for Meta Ads (same as sales)
      const since = syncStartDate.toISOString().split('T')[0];
      const until = formatBrasiliaDateString(0);

      console.log(`Meta Ads date range: ${since} to ${until}`);

      // Fetch daily_budget for each campaign
      const campaignBudgets: Record<string, number> = {};
      for (const campaignId of project.meta_campaign_ids) {
        try {
          const campaignUrl = `https://graph.facebook.com/v18.0/${campaignId}?fields=daily_budget&access_token=${access_token}`;
          const campaignResponse = await fetch(campaignUrl);
          if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
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

        for (const insight of insights) {
          const actions = insight.actions || [];
          const landingPageViewAction = actions.find(
            (a: { action_type: string }) => a.action_type === 'landing_page_view'
          );
          const landingPageViews = landingPageViewAction 
            ? parseInt(landingPageViewAction.value || '0') 
            : 0;

          const initiateCheckoutAction = actions.find(
            (a: { action_type: string }) => a.action_type === 'initiate_checkout'
          );
          const checkoutsInitiated = initiateCheckoutAction 
            ? parseInt(initiateCheckoutAction.value || '0') 
            : 0;

          const thruplayActions = insight.video_thruplay_watched_actions || [];
          const thruplayAction = thruplayActions.find(
            (a: { action_type: string }) => a.action_type === 'video_view'
          );
          const thruplays = thruplayAction 
            ? parseInt(thruplayAction.value || '0') 
            : 0;

          const video3sActions = insight.video_p25_watched_actions || [];
          const video3sAction = video3sActions.find(
            (a: { action_type: string }) => a.action_type === 'video_view'
          );
          const video3sViews = video3sAction 
            ? parseInt(video3sAction.value || '0') 
            : 0;

          const { error: upsertError } = await supabase
            .from('ad_spend')
            .upsert({
              project_id: project.id,
              user_id: project.user_id,
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
            }, { onConflict: 'campaign_id,date,project_id,ad_id' });

          if (upsertError) {
            console.error(`Failed to upsert insight:`, upsertError);
          } else {
            adSpendSynced++;
          }
        }
      }
    }

    // Update last_sync_at
    await supabase
      .from('projects')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', project_id);

    console.log(`Public sync: ${salesSynced} sales and ${adSpendSynced} ad spend records for project ${project_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        salesSynced, 
        adSpendSynced 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-public-project:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
