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

// ============ END PHASE 1 HELPERS ============

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
    const hotmartIntegration = integrations?.find(i => i.type === 'hotmart');
    const guruIntegration = integrations?.find(i => i.type === 'guru');
    const metaIntegration = integrations?.find(i => i.type === 'meta_ads');

    // === SYNC SUMMARY LOG (high priority - always visible) ===
    console.log(`\n${'='.repeat(60)}`);
    console.log(`=== SYNC START: Project ${project_id} ===`);
    console.log(`=== Integrations: Kiwify=${!!kiwifyIntegration}, Hotmart=${!!hotmartIntegration}, Guru=${!!guruIntegration}, Meta=${!!metaIntegration} ===`);
    console.log(`=== Products: Kiwify=${project.kiwify_product_ids?.length || 0}, Hotmart=${project.hotmart_product_ids?.length || 0}, Guru=${project.guru_product_ids?.length || 0}, Meta=${project.meta_campaign_ids?.length || 0} ===`);
    console.log(`${'='.repeat(60)}\n`);

    let salesSynced = 0;
    let adSpendSynced = 0;

    // Sync configuration
    const FIRST_SYNC_DAYS = 90;
    const INCREMENTAL_MARGIN_DAYS = 7;

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

    // ============ KIWIFY SYNC ============
    if (kiwifyIntegration && project.kiwify_product_ids?.length > 0) {
      const { client_id, client_secret, account_id } = kiwifyIntegration.credentials as { 
        client_id: string; 
        client_secret: string; 
        account_id: string;
      };

      // Get access token - Kiwify requires form-urlencoded format
      const tokenResponse = await fetchWithRetry('https://public-api.kiwify.com/v1/oauth/token', {
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

        console.log(`Syncing Kiwify sales from ${formattedStartDate} to ${formattedEndDate} (using tomorrow to include today's sales)`);

        let allSales: any[] = [];
        
        for (const productId of project.kiwify_product_ids) {
          let pageNumber = 1;
          let hasMorePages = true;
          
          console.log(`Fetching Kiwify sales for product: ${productId}`);
          
          while (hasMorePages) {
            const params = new URLSearchParams({
              start_date: formattedStartDate,
              end_date: formattedEndDate,
              page_size: '100',
              page_number: pageNumber.toString(),
              product_id: productId,
              view_full_sale_details: 'true',  // Necessário para obter payment.charge_amount (valor bruto)
            });

            const salesUrl = `https://public-api.kiwify.com/v1/sales?${params.toString()}`;
            const salesResponse = await fetchWithRetry(salesUrl, {
              headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'x-kiwify-account-id': account_id
              },
            });

            if (salesResponse.ok) {
              const salesData = await salesResponse.json();
              const sales = salesData.data || [];
              
              console.log(`Kiwify product ${productId} - Page ${pageNumber}: ${sales.length} sales`);
              
              // Debug log - Log FULL structure of first sale to investigate fields
              for (const s of sales) {
                if (allSales.length === 0 && sales.indexOf(s) === 0) {
                  console.log('=== KIWIFY FULL SALE STRUCTURE ===');
                  console.log(JSON.stringify(s, null, 2));
                  console.log('=== END FULL SALE STRUCTURE ===');
                }
                console.log(`  - Sale ${s.id}: customer=${s.customer?.name || 'N/A'}, status=${s.status}, date=${s.created_at}, net_amount=${s.net_amount}, amount=${s.amount}, charges=${JSON.stringify(s.charges)}, payment=${JSON.stringify(s.payment)}`);
              }
              
              allSales = allSales.concat(sales);
              
              if (sales.length < 100) {
                hasMorePages = false;
              } else {
                pageNumber++;
              }
            } else {
              const errorText = await salesResponse.text();
              console.error(`Error fetching Kiwify sales for product ${productId}:`, errorText);
              hasMorePages = false;
            }
          }
        }

        console.log(`Total Kiwify sales fetched: ${allSales.length}`);

        // Get fixed ticket price if configured
        const ticketPrice = (project as any).kiwify_ticket_price 
          ? parseFloat((project as any).kiwify_ticket_price) 
          : null;
        
        if (ticketPrice) {
          console.log(`Using fixed ticket price for Kiwify: R$ ${ticketPrice}`);
        }

        for (const sale of allSales) {
          const tracking = sale.tracking || {};
          
          // Valor líquido (parte do produtor após split de coprodução) - usando parseAmount para validação
          const netAmount = parseAmount(sale.net_amount || sale.amount || 0) / 100;
          
          // Valor bruto: usar preço fixo se configurado, senão calcular
          let grossAmount: number;
          if (ticketPrice !== null) {
            grossAmount = ticketPrice;
          } else {
            const chargeAmount = parseAmount(sale.payment?.charge_amount || 0);
            const platformFee = parseAmount(sale.payment?.fee || 0);
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
              user_id: userId,
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
              source: 'kiwify',
            }, { onConflict: 'kiwify_sale_id' });

          if (!upsertError) salesSynced++;
        }
      } else {
        console.error('Failed to get Kiwify access token:', await tokenResponse.text());
      }
    }

    // ============ HOTMART SYNC ============
    if (hotmartIntegration && project.hotmart_product_ids?.length > 0) {
      const { client_id, client_secret, basic_token } = hotmartIntegration.credentials as {
        client_id: string;
        client_secret: string;
        basic_token: string;
      };

      console.log('\n>>> HOTMART SYNC STARTING <<<');
      console.log(`Products to sync: ${project.hotmart_product_ids.join(', ')}`);
      console.log(`Credentials: client_id=${client_id ? 'SET' : 'MISSING'}, basic_token=${basic_token ? 'SET' : 'MISSING'}`);

      try {
        // Get access token from Hotmart
        console.log('Requesting Hotmart OAuth token...');
        const tokenResponse = await fetchWithRetry('https://api-sec-vlc.hotmart.com/security/oauth/token', {
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

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          const accessToken = tokenData.access_token;
          console.log('Hotmart OAuth token obtained successfully');

          const startTimestamp = syncStartDate.getTime();
          const endTimestamp = nowBrasilia.getTime();

          console.log(`Syncing Hotmart sales from ${new Date(startTimestamp).toISOString()} to ${new Date(endTimestamp).toISOString()}`);

        // Fetch sales history from Hotmart
        for (const productId of project.hotmart_product_ids) {
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const salesUrl = `https://developers.hotmart.com/payments/api/v1/sales/history?product_id=${productId}&start_date=${startTimestamp}&end_date=${endTimestamp}&max_results=100&page=${page}`;
            
            const salesResponse = await fetchWithRetry(salesUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (salesResponse.ok) {
              const salesData = await salesResponse.json();
              const sales = salesData.items || [];
              
              console.log(`Hotmart product ${productId} - Page ${page}: ${sales.length} sales`);

              for (const sale of sales) {
                const saleId = `hotmart_${sale.purchase?.transaction || sale.transaction || Date.now()}`;
                
                // Hotmart: amount é o valor total, não há split visível na API - usando parseAmount para validação
                const saleAmount = parseAmount(sale.purchase?.price?.value || sale.price || 0) / 100;
                
                const { error: upsertError } = await supabase
                  .from('sales')
                  .upsert({
                    kiwify_sale_id: saleId,
                    project_id: project.id,
                    user_id: userId,
                    product_id: productId,
                    product_name: sale.product?.name || sale.product_name,
                    amount: saleAmount,
                    gross_amount: saleAmount, // Hotmart não expõe split, usar mesmo valor
                    status: normalizeStatus(sale.purchase?.status || sale.status || 'approved', 'hotmart'),
                    payment_method: sale.purchase?.payment?.type || sale.payment_type,
                    customer_name: sale.buyer?.name || sale.buyer_name,
                    customer_email: sale.buyer?.email || sale.buyer_email,
                    sale_date: sale.purchase?.approved_date || sale.approved_date || sale.order_date,
                    utm_source: sale.purchase?.tracking?.source || sale.tracking?.source,
                    utm_medium: sale.purchase?.tracking?.medium || sale.tracking?.medium,
                    utm_campaign: sale.purchase?.tracking?.utm_campaign,
                    utm_content: sale.purchase?.tracking?.utm_content,
                    utm_term: sale.purchase?.tracking?.utm_term,
                    source: 'hotmart',
                  }, { onConflict: 'kiwify_sale_id' });

                if (!upsertError) salesSynced++;
              }

              if (sales.length < 100) {
                hasMore = false;
              } else {
                page++;
              }
            } else {
              const errorText = await salesResponse.text();
              console.error(`Error fetching Hotmart sales for product ${productId}:`, errorText);
              hasMore = false;
            }
          }
        }
        } else {
          const errorBody = await tokenResponse.text();
          console.error(`HOTMART TOKEN ERROR: Status ${tokenResponse.status}`);
          console.error(`HOTMART TOKEN ERROR Body: ${errorBody}`);
        }
      } catch (hotmartError) {
        console.error('HOTMART SYNC EXCEPTION:', hotmartError);
      }
      console.log(`>>> HOTMART SYNC COMPLETE: ${salesSynced} sales <<<\n`);
    } else if (hotmartIntegration) {
      console.log('HOTMART: Integration active but no products selected');
    }

    // ============ GURU DMG SYNC ============
    const guruSalesStart = salesSynced; // Track Guru-specific sales
    if (guruIntegration && project.guru_product_ids?.length > 0) {
      const { api_token } = guruIntegration.credentials as { api_token: string };

      console.log('\n>>> GURU DMG SYNC STARTING <<<');
      console.log(`Products to sync: ${project.guru_product_ids.join(', ')}`);
      console.log(`API Token: ${api_token ? 'SET (' + api_token.substring(0, 8) + '...)' : 'MISSING'}`);

      const startDate = syncStartDate.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      console.log(`Date range: ${startDate} to ${endDate}`);

      try {
        for (const productId of project.guru_product_ids) {
          let page = 1;
          let hasMore = true;

          console.log(`Fetching Guru sales for product: ${productId}`);

          while (hasMore) {
            // API v2 - Updated endpoint
            const salesUrl = `https://digitalmanager.guru/api/v2/transactions?product_id=${productId}&start_date=${startDate}&end_date=${endDate}&page=${page}&per_page=100`;
            console.log(`Guru API request: ${salesUrl.replace(api_token, 'TOKEN')}`);
            
            const salesResponse = await fetchWithRetry(salesUrl, {
              headers: {
                'Authorization': `Bearer ${api_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            });

            console.log(`Guru API response status: ${salesResponse.status}`);

          if (salesResponse.ok) {
            const salesData = await salesResponse.json();
            const sales = salesData.data || salesData.transactions || [];
            
            console.log(`Guru product ${productId} - Page ${page}: ${sales.length} sales`);

            for (const sale of sales) {
              const saleId = `guru_${sale.id || sale.transaction_id || Date.now()}`;
              
              // Guru: valor já vem em reais, não em centavos - usando parseAmount para validação
              const saleAmount = parseAmount(sale.amount || sale.value || sale.price || 0);
              
              const { error: upsertError } = await supabase
                .from('sales')
                .upsert({
                  kiwify_sale_id: saleId,
                  project_id: project.id,
                  user_id: userId,
                  product_id: productId,
                  product_name: sale.product?.name || sale.product_name,
                  amount: saleAmount,
                  gross_amount: saleAmount, // Guru não expõe split, usar mesmo valor
                  status: normalizeStatus(sale.status || 'approved', 'guru'),
                  payment_method: sale.payment_method || sale.payment_type,
                  customer_name: sale.customer?.name || sale.buyer?.name || sale.customer_name,
                  customer_email: sale.customer?.email || sale.buyer?.email || sale.customer_email,
                  sale_date: sale.created_at || sale.date || sale.approved_at,
                  utm_source: sale.utm_source || sale.tracking?.utm_source,
                  utm_medium: sale.utm_medium || sale.tracking?.utm_medium,
                  utm_campaign: sale.utm_campaign || sale.tracking?.utm_campaign,
                  utm_content: sale.utm_content || sale.tracking?.utm_content,
                  utm_term: sale.utm_term || sale.tracking?.utm_term,
                  source: 'guru',
                }, { onConflict: 'kiwify_sale_id' });

              if (!upsertError) salesSynced++;
            }

            const totalPages = salesData.meta?.last_page || salesData.last_page || 1;
            if (page >= totalPages || sales.length < 100) {
              hasMore = false;
            } else {
              page++;
            }
            } else {
              const errorText = await salesResponse.text();
              console.error(`GURU API ERROR for product ${productId}: Status ${salesResponse.status}`);
              console.error(`GURU API ERROR Body: ${errorText}`);
              hasMore = false;
            }
          }
        }
      } catch (guruError) {
        console.error('GURU SYNC EXCEPTION:', guruError);
      }
      const guruSalesTotal = salesSynced - guruSalesStart;
      console.log(`>>> GURU SYNC COMPLETE: ${guruSalesTotal} sales <<<\n`);
    } else if (guruIntegration) {
      console.log('GURU: Integration active but no products selected');
    }

    // Sync Meta Ads spend
    if (metaIntegration && project.meta_campaign_ids?.length > 0) {
      const { access_token, ad_account_id } = metaIntegration.credentials as { access_token: string; ad_account_id: string };

      console.log(`Starting Meta Ads sync for project ${project_id}`);
      console.log(`Ad Account: ${ad_account_id}`);
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
            // daily_budget comes in cents from Meta API
            campaignBudgets[campaignId] = campaignData.daily_budget ? parseFloat(campaignData.daily_budget) / 100 : 0;
            console.log(`Campaign ${campaignId} daily budget: ${campaignBudgets[campaignId]}`);
          }
        } catch (e) {
          console.error(`Failed to fetch budget for campaign ${campaignId}:`, e);
        }
      }

      for (const campaignId of project.meta_campaign_ids) {
        const insightsUrl = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,clicks,reach,frequency,cpc,cpm,inline_link_clicks,actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions&time_range={"since":"${since}","until":"${until}"}&level=ad&time_increment=1&access_token=${access_token}`;
        
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

          // Extract video percentage views helper
          const extractVideoViews = (videoActions: any[]) => {
            if (!videoActions) return 0;
            const action = videoActions.find((a: { action_type: string }) => a.action_type === 'video_view');
            return action ? parseInt(action.value || '0') : 0;
          };

          // Extract 3-second video views from video_p25_watched_actions (approximation for hook)
          const video3sViews = extractVideoViews(insight.video_p25_watched_actions);
          const videoP25Views = extractVideoViews(insight.video_p25_watched_actions);
          const videoP50Views = extractVideoViews(insight.video_p50_watched_actions);
          const videoP75Views = extractVideoViews(insight.video_p75_watched_actions);
          const videoP100Views = extractVideoViews(insight.video_p100_watched_actions);

          console.log(`Upserting insight: date=${insight.date_start}, spend=${insight.spend}, campaign=${insight.campaign_name}, lpViews=${landingPageViews}, checkouts=${checkoutsInitiated}, thruplays=${thruplays}, 3s=${video3sViews}, p75=${videoP75Views}, p100=${videoP100Views}`);
          
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
              video_3s_views: video3sViews,
              video_p25_views: videoP25Views,
              video_p50_views: videoP50Views,
              video_p75_views: videoP75Views,
              video_p100_views: videoP100Views,
              date: insight.date_start,
            }, { onConflict: 'campaign_id,date,project_id,ad_id' });

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