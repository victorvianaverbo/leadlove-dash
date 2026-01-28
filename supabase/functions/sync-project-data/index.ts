import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ PHASE 1 HELPERS ============

/**
 * Fetch with automatic retry and exponential backoff for rate limiting (429) and server errors (5xx)
 * This prevents silent failures when APIs are overloaded
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    // Rate limit or server error - retry with exponential backoff
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        console.warn(`fetchWithRetry: Max retries (${maxRetries}) reached for ${url}, returning last response`);
        return response;
      }

      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter
        ? parseInt(retryAfter) * 1000
        : Math.pow(2, attempt) * 1000; // 2s, 4s, 8s exponential backoff

      console.log(`fetchWithRetry: Attempt ${attempt} failed (${response.status}). Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }

    return response;
  }
  throw new Error(`fetchWithRetry: Max retries exceeded for ${url}`);
}

/**
 * Parse and validate monetary amounts to prevent NaN/undefined in database
 * Returns 0 for invalid values (null, undefined, negative, NaN)
 */
function parseAmount(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

// ============ PHASE 2 HELPERS ============

/**
 * Batch upsert sales records in chunks to avoid transaction limits
 * Uses smaller batch sizes to prevent timeout and memory issues
 */
async function batchUpsertSales(
  supabase: any,
  sales: any[],
  batchSize = 50
): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  for (let i = 0; i < sales.length; i += batchSize) {
    const batch = sales.slice(i, i + batchSize);
    const { error } = await supabase
      .from('sales')
      .upsert(batch, { onConflict: 'kiwify_sale_id' });

    if (error) {
      console.error(`Batch upsert error (batch ${Math.floor(i / batchSize) + 1}):`, error);
      errors += batch.length;
    } else {
      success += batch.length;
    }
  }

  return { success, errors };
}

/**
 * Batch upsert ad_spend records in chunks
 */
async function batchUpsertAdSpend(
  supabase: any,
  records: any[],
  batchSize = 50
): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase
      .from('ad_spend')
      .upsert(batch, { onConflict: 'campaign_id,date,project_id,ad_id' });

    if (error) {
      console.error(`Ad spend batch upsert error (batch ${Math.floor(i / batchSize) + 1}):`, error);
      errors += batch.length;
    } else {
      success += batch.length;
    }
  }

  return { success, errors };
}

// ============ END PHASE 2 HELPERS ============

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

// Normalize status across all platforms to standard values: paid, refunded, pending, canceled
function normalizeStatus(status: string, source: string): string {
  const statusLower = (status || '').toLowerCase().trim();
  
  // Kiwify status normalization
  if (source === 'kiwify') {
    if (statusLower === 'paid' || statusLower === 'approved') return 'paid';
    if (statusLower === 'refunded' || statusLower === 'refund') return 'refunded';
    if (statusLower === 'charged_back' || statusLower === 'chargedback' || statusLower === 'chargeback') return 'refunded';
    if (statusLower === 'waiting_payment' || statusLower === 'pending') return 'pending';
    if (statusLower === 'refused' || statusLower === 'declined' || statusLower === 'rejected') return 'canceled';
  }
  
  // Hotmart status normalization
  if (source === 'hotmart') {
    if (statusLower === 'approved' || statusLower === 'complete' || statusLower === 'completed') return 'paid';
    if (statusLower === 'refunded') return 'refunded';
    if (statusLower === 'chargeback' || statusLower === 'dispute' || statusLower === 'chargedback') return 'refunded';
    if (statusLower === 'waiting_payment' || statusLower === 'billet_printed' || statusLower === 'pending') return 'pending';
    if (statusLower === 'cancelled' || statusLower === 'canceled' || statusLower === 'expired') return 'canceled';
  }
  
  // Guru status normalization  
  if (source === 'guru') {
    if (statusLower === 'approved' || statusLower === 'paid') return 'paid';
    if (statusLower === 'refunded' || statusLower === 'refund') return 'refunded';
    if (statusLower === 'chargeback' || statusLower === 'chargedback') return 'refunded';
    if (statusLower === 'pending' || statusLower === 'waiting') return 'pending';
    if (statusLower === 'cancelled' || statusLower === 'canceled') return 'canceled';
  }
  
  // Fallback - try common patterns
  if (statusLower === 'paid' || statusLower === 'approved') return 'paid';
  if (statusLower.includes('refund') || statusLower.includes('chargeback')) return 'refunded';
  if (statusLower.includes('pending') || statusLower.includes('waiting')) return 'pending';
  if (statusLower.includes('cancel') || statusLower.includes('refused')) return 'canceled';
  
  return statusLower; // Return as-is if no match
}

// ============ PLATFORM SYNC FUNCTIONS (for Promise.all parallelization) ============

interface SaleRecord {
  kiwify_sale_id: string;
  project_id: string;
  user_id: string;
  product_id: string;
  product_name: string | null;
  amount: number;
  gross_amount: number;
  status: string;
  payment_method: string | null;
  customer_name: string | null;
  customer_email: string | null;
  sale_date: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  source: string;
}

interface SyncResult {
  sales: SaleRecord[];
  source: string;
  error?: string;
}

/**
 * Sync Kiwify sales - returns array of sale records for batch insert
 */
async function syncKiwify(
  credentials: { client_id: string; client_secret: string; account_id: string },
  productIds: string[],
  projectId: string,
  userId: string,
  syncStartDate: Date,
  ticketPrice: number | null
): Promise<SyncResult> {
  const result: SyncResult = { sales: [], source: 'kiwify' };
  
  try {
    console.log(`[KIWIFY] Starting sync for ${productIds.length} products`);
    
    // Get access token
    const tokenResponse = await fetchWithRetry('https://public-api.kiwify.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      result.error = `Token error: ${tokenResponse.status}`;
      console.error(`[KIWIFY] ${result.error}`);
      return result;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const formattedStartDate = syncStartDate.toISOString().split('T')[0];
    const endDateObj = getBrasiliaDate(-1);
    const formattedEndDate = endDateObj.toISOString().split('T')[0];

    // Fetch all sales from all products
    for (const productId of productIds) {
      let pageNumber = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        const params = new URLSearchParams({
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          page_size: '100',
          page_number: pageNumber.toString(),
          product_id: productId,
          view_full_sale_details: 'true',
        });

        const salesResponse = await fetchWithRetry(
          `https://public-api.kiwify.com/v1/sales?${params.toString()}`,
          {
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'x-kiwify-account-id': credentials.account_id
            },
          }
        );

        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          const sales = salesData.data || [];
          
          console.log(`[KIWIFY] Product ${productId} - Page ${pageNumber}: ${sales.length} sales`);
          
          // Transform sales to database format
          for (const sale of sales) {
            const tracking = sale.tracking || {};
            const netAmount = parseAmount(sale.net_amount || sale.amount || 0) / 100;
            
            let grossAmount: number;
            if (ticketPrice !== null) {
              grossAmount = ticketPrice;
            } else {
              const chargeAmount = parseAmount(sale.payment?.charge_amount || 0);
              const platformFee = parseAmount(sale.payment?.fee || 0);
              grossAmount = chargeAmount > 0 ? (chargeAmount - platformFee) / 100 : netAmount;
            }
            
            result.sales.push({
              kiwify_sale_id: sale.id,
              project_id: projectId,
              user_id: userId,
              product_id: sale.product?.id || productId,
              product_name: sale.product?.name || null,
              amount: netAmount,
              gross_amount: grossAmount,
              status: normalizeStatus(sale.status, 'kiwify'),
              payment_method: sale.payment_method || null,
              customer_name: sale.customer?.name || null,
              customer_email: sale.customer?.email || null,
              sale_date: sale.created_at,
              utm_source: tracking.utm_source || null,
              utm_medium: tracking.utm_medium || null,
              utm_campaign: tracking.utm_campaign || null,
              utm_content: tracking.utm_content || null,
              utm_term: tracking.utm_term || null,
              source: 'kiwify',
            });
          }
          
          hasMorePages = sales.length >= 100;
          pageNumber++;
        } else {
          console.error(`[KIWIFY] Error fetching product ${productId}:`, await salesResponse.text());
          hasMorePages = false;
        }
      }
    }

    console.log(`[KIWIFY] Completed: ${result.sales.length} sales fetched`);
  } catch (error) {
    result.error = (error as Error).message;
    console.error('[KIWIFY] Exception:', error);
  }
  
  return result;
}

/**
 * Sync Hotmart sales - returns array of sale records for batch insert
 */
async function syncHotmart(
  credentials: { client_id: string; client_secret: string; basic_token: string },
  productIds: string[],
  projectId: string,
  userId: string,
  syncStartDate: Date,
  nowBrasilia: Date
): Promise<SyncResult> {
  const result: SyncResult = { sales: [], source: 'hotmart' };
  
  try {
    console.log(`[HOTMART] Starting sync for ${productIds.length} products`);
    
    // Get access token
    const tokenResponse = await fetchWithRetry('https://api-sec-vlc.hotmart.com/security/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials.basic_token}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      result.error = `Token error: ${tokenResponse.status}`;
      console.error(`[HOTMART] ${result.error}`);
      return result;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const startTimestamp = syncStartDate.getTime();
    const endTimestamp = nowBrasilia.getTime();

    // Fetch sales for each product
    for (const productId of productIds) {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const salesResponse = await fetchWithRetry(
          `https://developers.hotmart.com/payments/api/v1/sales/history?product_id=${productId}&start_date=${startTimestamp}&end_date=${endTimestamp}&max_results=100&page=${page}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          const sales = salesData.items || [];
          
          console.log(`[HOTMART] Product ${productId} - Page ${page}: ${sales.length} sales`);

          for (const sale of sales) {
            const saleId = `hotmart_${sale.purchase?.transaction || sale.transaction || Date.now()}`;
            const saleAmount = parseAmount(sale.purchase?.price?.value || sale.price || 0) / 100;
            
            result.sales.push({
              kiwify_sale_id: saleId,
              project_id: projectId,
              user_id: userId,
              product_id: productId,
              product_name: sale.product?.name || sale.product_name || null,
              amount: saleAmount,
              gross_amount: saleAmount,
              status: normalizeStatus(sale.purchase?.status || sale.status || 'approved', 'hotmart'),
              payment_method: sale.purchase?.payment?.type || sale.payment_type || null,
              customer_name: sale.buyer?.name || sale.buyer_name || null,
              customer_email: sale.buyer?.email || sale.buyer_email || null,
              sale_date: sale.purchase?.approved_date || sale.approved_date || sale.order_date,
              utm_source: sale.purchase?.tracking?.source || sale.tracking?.source || null,
              utm_medium: sale.purchase?.tracking?.medium || sale.tracking?.medium || null,
              utm_campaign: sale.purchase?.tracking?.utm_campaign || null,
              utm_content: sale.purchase?.tracking?.utm_content || null,
              utm_term: sale.purchase?.tracking?.utm_term || null,
              source: 'hotmart',
            });
          }

          hasMore = sales.length >= 100;
          page++;
        } else {
          console.error(`[HOTMART] Error fetching product ${productId}:`, await salesResponse.text());
          hasMore = false;
        }
      }
    }

    console.log(`[HOTMART] Completed: ${result.sales.length} sales fetched`);
  } catch (error) {
    result.error = (error as Error).message;
    console.error('[HOTMART] Exception:', error);
  }
  
  return result;
}

/**
 * Sync Guru sales - returns array of sale records for batch insert
 */
async function syncGuru(
  credentials: { api_token: string },
  productIds: string[],
  projectId: string,
  userId: string,
  syncStartDate: Date
): Promise<SyncResult> {
  const result: SyncResult = { sales: [], source: 'guru' };
  
  try {
    console.log(`[GURU] Starting sync for ${productIds.length} products`);
    
    const startDate = syncStartDate.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    for (const productId of productIds) {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const salesResponse = await fetchWithRetry(
          `https://digitalmanager.guru/api/v2/transactions?product_id=${productId}&start_date=${startDate}&end_date=${endDate}&page=${page}&per_page=100`,
          {
            headers: {
              'Authorization': `Bearer ${credentials.api_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        );

        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          const sales = salesData.data || salesData.transactions || [];
          
          console.log(`[GURU] Product ${productId} - Page ${page}: ${sales.length} sales`);

          for (const sale of sales) {
            const saleId = `guru_${sale.id || sale.transaction_id || Date.now()}`;
            const saleAmount = parseAmount(sale.amount || sale.value || sale.price || 0);
            
            result.sales.push({
              kiwify_sale_id: saleId,
              project_id: projectId,
              user_id: userId,
              product_id: productId,
              product_name: sale.product?.name || sale.product_name || null,
              amount: saleAmount,
              gross_amount: saleAmount,
              status: normalizeStatus(sale.status || 'approved', 'guru'),
              payment_method: sale.payment_method || sale.payment_type || null,
              customer_name: sale.customer?.name || sale.buyer?.name || sale.customer_name || null,
              customer_email: sale.customer?.email || sale.buyer?.email || sale.customer_email || null,
              sale_date: sale.created_at || sale.date || sale.approved_at,
              utm_source: sale.utm_source || sale.tracking?.utm_source || null,
              utm_medium: sale.utm_medium || sale.tracking?.utm_medium || null,
              utm_campaign: sale.utm_campaign || sale.tracking?.utm_campaign || null,
              utm_content: sale.utm_content || sale.tracking?.utm_content || null,
              utm_term: sale.utm_term || sale.tracking?.utm_term || null,
              source: 'guru',
            });
          }

          const totalPages = salesData.meta?.last_page || salesData.last_page || 1;
          hasMore = page < totalPages && sales.length >= 100;
          page++;
        } else {
          console.error(`[GURU] Error fetching product ${productId}:`, await salesResponse.text());
          hasMore = false;
        }
      }
    }

    console.log(`[GURU] Completed: ${result.sales.length} sales fetched`);
  } catch (error) {
    result.error = (error as Error).message;
    console.error('[GURU] Exception:', error);
  }
  
  return result;
}

/**
 * Sync Meta Ads - returns array of ad_spend records for batch insert
 */
async function syncMetaAds(
  credentials: { access_token: string; ad_account_id: string },
  campaignIds: string[],
  projectId: string,
  userId: string,
  syncStartDate: Date
): Promise<{ records: any[]; source: string; error?: string }> {
  const result: { records: any[]; source: string; error?: string } = { records: [], source: 'meta_ads' };
  
  try {
    console.log(`[META] Starting sync for ${campaignIds.length} campaigns`);
    
    const since = syncStartDate.toISOString().split('T')[0];
    const until = formatBrasiliaDateString(0);

    // Fetch daily_budget for each campaign in parallel
    const budgetPromises = campaignIds.map(async (campaignId) => {
      try {
        const campaignResponse = await fetch(
          `https://graph.facebook.com/v18.0/${campaignId}?fields=daily_budget&access_token=${credentials.access_token}`
        );
        if (campaignResponse.ok) {
          const campaignData = await campaignResponse.json();
          return { campaignId, budget: campaignData.daily_budget ? parseFloat(campaignData.daily_budget) / 100 : 0 };
        }
      } catch (e) {
        console.error(`[META] Failed to fetch budget for campaign ${campaignId}`);
      }
      return { campaignId, budget: 0 };
    });

    const budgetResults = await Promise.all(budgetPromises);
    const campaignBudgets: Record<string, number> = {};
    budgetResults.forEach(r => { campaignBudgets[r.campaignId] = r.budget; });

    // Fetch insights for each campaign
    for (const campaignId of campaignIds) {
      const insightsUrl = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,clicks,reach,frequency,cpc,cpm,inline_link_clicks,actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions&time_range={"since":"${since}","until":"${until}"}&level=ad&time_increment=1&access_token=${credentials.access_token}`;
      
      const insightsResponse = await fetch(insightsUrl);
      const responseText = await insightsResponse.text();

      if (!insightsResponse.ok) {
        console.error(`[META] API error for campaign ${campaignId}:`, responseText);
        continue;
      }

      let insightsData;
      try {
        insightsData = JSON.parse(responseText);
      } catch (e) {
        console.error(`[META] Failed to parse response for campaign ${campaignId}`);
        continue;
      }

      const insights = insightsData.data || [];
      console.log(`[META] Campaign ${campaignId}: ${insights.length} insights`);

      for (const insight of insights) {
        const actions = insight.actions || [];
        const landingPageViewAction = actions.find((a: { action_type: string }) => a.action_type === 'landing_page_view');
        const landingPageViews = landingPageViewAction ? parseInt(landingPageViewAction.value || '0') : 0;

        const initiateCheckoutAction = actions.find((a: { action_type: string }) => a.action_type === 'initiate_checkout');
        const checkoutsInitiated = initiateCheckoutAction ? parseInt(initiateCheckoutAction.value || '0') : 0;

        const thruplayActions = insight.video_thruplay_watched_actions || [];
        const thruplayAction = thruplayActions.find((a: { action_type: string }) => a.action_type === 'video_view');
        const thruplays = thruplayAction ? parseInt(thruplayAction.value || '0') : 0;

        const extractVideoViews = (videoActions: any[]) => {
          if (!videoActions) return 0;
          const action = videoActions.find((a: { action_type: string }) => a.action_type === 'video_view');
          return action ? parseInt(action.value || '0') : 0;
        };

        result.records.push({
          project_id: projectId,
          user_id: userId,
          campaign_id: insight.campaign_id,
          campaign_name: insight.campaign_name,
          adset_id: insight.adset_id,
          adset_name: insight.adset_name,
          ad_id: insight.ad_id,
          ad_name: insight.ad_name,
          spend: parseAmount(insight.spend),
          impressions: parseInt(insight.impressions || '0'),
          clicks: parseInt(insight.clicks || '0'),
          reach: parseInt(insight.reach || '0'),
          frequency: parseAmount(insight.frequency),
          cpc: parseAmount(insight.cpc),
          cpm: parseAmount(insight.cpm),
          link_clicks: parseInt(insight.inline_link_clicks || '0'),
          landing_page_views: landingPageViews,
          daily_budget: campaignBudgets[campaignId] || 0,
          checkouts_initiated: checkoutsInitiated,
          thruplays: thruplays,
          video_3s_views: extractVideoViews(insight.video_p25_watched_actions),
          video_p25_views: extractVideoViews(insight.video_p25_watched_actions),
          video_p50_views: extractVideoViews(insight.video_p50_watched_actions),
          video_p75_views: extractVideoViews(insight.video_p75_watched_actions),
          video_p100_views: extractVideoViews(insight.video_p100_watched_actions),
          date: insight.date_start,
        });
      }
    }

    console.log(`[META] Completed: ${result.records.length} insights fetched`);
  } catch (error) {
    result.error = (error as Error).message;
    console.error('[META] Exception:', error);
  }
  
  return result;
}

// ============ MAIN HANDLER ============

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

    // Fetch integrations
    const { data: integrations } = await supabase
      .from('integrations')
      .select('*')
      .eq('project_id', project_id)
      .eq('is_active', true);

    const kiwifyIntegration = integrations?.find(i => i.type === 'kiwify');
    const hotmartIntegration = integrations?.find(i => i.type === 'hotmart');
    const guruIntegration = integrations?.find(i => i.type === 'guru');
    const metaIntegration = integrations?.find(i => i.type === 'meta_ads');

    // === SYNC SUMMARY LOG ===
    console.log(`\n${'='.repeat(60)}`);
    console.log(`=== SYNC START (PHASE 2 - PARALLEL): Project ${project_id} ===`);
    console.log(`=== Integrations: Kiwify=${!!kiwifyIntegration}, Hotmart=${!!hotmartIntegration}, Guru=${!!guruIntegration}, Meta=${!!metaIntegration} ===`);
    console.log(`=== Products: Kiwify=${project.kiwify_product_ids?.length || 0}, Hotmart=${project.hotmart_product_ids?.length || 0}, Guru=${project.guru_product_ids?.length || 0}, Meta=${project.meta_campaign_ids?.length || 0} ===`);
    console.log(`${'='.repeat(60)}\n`);

    // Sync configuration
    const FIRST_SYNC_DAYS = 90;
    const INCREMENTAL_MARGIN_DAYS = 7;

    const isFirstSync = !project.last_sync_at;
    const nowBrasilia = getBrasiliaDate(0);
    
    let syncStartDate: Date;
    if (isFirstSync) {
      syncStartDate = getBrasiliaDate(FIRST_SYNC_DAYS);
      console.log(`First sync detected - fetching ${FIRST_SYNC_DAYS} days of data`);
    } else {
      const lastSync = new Date(project.last_sync_at);
      syncStartDate = new Date(lastSync.getTime() - INCREMENTAL_MARGIN_DAYS * 24 * 60 * 60 * 1000);
      console.log(`Incremental sync - fetching data since ${syncStartDate.toISOString()}`);
    }

    // Get fixed ticket price if configured
    const ticketPrice = project.kiwify_ticket_price ? parseFloat(project.kiwify_ticket_price) : null;

    // ============ PHASE 2: PARALLEL SYNC WITH Promise.all ============
    console.log('\n>>> STARTING PARALLEL SYNC <<<\n');
    const startTime = Date.now();

    // Build array of sync promises (only for active integrations with products)
    const syncPromises: Promise<SyncResult | { records: any[]; source: string; error?: string }>[] = [];

    if (kiwifyIntegration && project.kiwify_product_ids?.length > 0) {
      syncPromises.push(
        syncKiwify(
          kiwifyIntegration.credentials as any,
          project.kiwify_product_ids,
          project.id,
          userId,
          syncStartDate,
          ticketPrice
        )
      );
    }

    if (hotmartIntegration && project.hotmart_product_ids?.length > 0) {
      syncPromises.push(
        syncHotmart(
          hotmartIntegration.credentials as any,
          project.hotmart_product_ids,
          project.id,
          userId,
          syncStartDate,
          nowBrasilia
        )
      );
    }

    if (guruIntegration && project.guru_product_ids?.length > 0) {
      syncPromises.push(
        syncGuru(
          guruIntegration.credentials as any,
          project.guru_product_ids,
          project.id,
          userId,
          syncStartDate
        )
      );
    }

    if (metaIntegration && project.meta_campaign_ids?.length > 0) {
      syncPromises.push(
        syncMetaAds(
          metaIntegration.credentials as any,
          project.meta_campaign_ids,
          project.id,
          userId,
          syncStartDate
        )
      );
    }

    // Execute all syncs in parallel
    const syncResults = await Promise.all(syncPromises);
    
    const fetchTime = Date.now() - startTime;
    console.log(`\n>>> PARALLEL FETCH COMPLETED in ${fetchTime}ms <<<\n`);

    // Collect all sales and ad_spend records
    const allSales: SaleRecord[] = [];
    let adSpendRecords: any[] = [];

    for (const result of syncResults) {
      if ('sales' in result) {
        allSales.push(...result.sales);
        console.log(`[${result.source.toUpperCase()}] ${result.sales.length} sales ready for batch insert`);
      } else if ('records' in result) {
        adSpendRecords = result.records;
        console.log(`[META] ${result.records.length} ad_spend records ready for batch insert`);
      }
    }

    // ============ BATCH INSERT ============
    console.log('\n>>> STARTING BATCH INSERT <<<\n');
    const insertStart = Date.now();

    let salesSynced = 0;
    let adSpendSynced = 0;

    // Batch upsert sales
    if (allSales.length > 0) {
      console.log(`Batch upserting ${allSales.length} sales...`);
      const salesResult = await batchUpsertSales(supabase, allSales);
      salesSynced = salesResult.success;
      console.log(`Sales batch complete: ${salesResult.success} success, ${salesResult.errors} errors`);
    }

    // Batch upsert ad_spend
    if (adSpendRecords.length > 0) {
      console.log(`Batch upserting ${adSpendRecords.length} ad_spend records...`);
      const adSpendResult = await batchUpsertAdSpend(supabase, adSpendRecords);
      adSpendSynced = adSpendResult.success;
      console.log(`Ad spend batch complete: ${adSpendResult.success} success, ${adSpendResult.errors} errors`);
    }

    const insertTime = Date.now() - insertStart;
    console.log(`\n>>> BATCH INSERT COMPLETED in ${insertTime}ms <<<\n`);

    // Update last_sync_at
    await supabase
      .from('projects')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', project_id);

    const totalTime = Date.now() - startTime;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`=== SYNC COMPLETE ===`);
    console.log(`=== Sales: ${salesSynced}, Ad Spend: ${adSpendSynced} ===`);
    console.log(`=== Fetch: ${fetchTime}ms, Insert: ${insertTime}ms, Total: ${totalTime}ms ===`);
    console.log(`${'='.repeat(60)}\n`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        salesSynced, 
        adSpendSynced,
        timing: { fetch: fetchTime, insert: insertTime, total: totalTime }
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
