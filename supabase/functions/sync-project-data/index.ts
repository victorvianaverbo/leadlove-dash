import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { project_id } = await req.json();
    if (!project_id) throw new Error('project_id required');

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();
    if (projectError || !project) throw new Error('Project not found');

    // Get integrations
    const { data: integrations } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const kiwify = integrations?.find(i => i.type === 'kiwify');
    const meta = integrations?.find(i => i.type === 'meta_ads');

    let salesSynced = 0;
    let adsSynced = 0;

    // Sync Kiwify sales
    if (kiwify && project.kiwify_product_ids?.length > 0) {
      const creds = kiwify.credentials as { client_id: string; client_secret: string };
      
      // Get access token
      const tokenRes = await fetch('https://api.kiwify.com.br/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: creds.client_id,
          client_secret: creds.client_secret,
        }),
      });
      
      if (tokenRes.ok) {
        const { access_token } = await tokenRes.json();
        
        // Fetch sales
        const salesRes = await fetch('https://api.kiwify.com.br/v1/sales?limit=100', {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        
        if (salesRes.ok) {
          const { data: sales } = await salesRes.json();
          
          for (const sale of sales || []) {
            if (!project.kiwify_product_ids.includes(sale.product_id)) continue;
            
            const tracking = sale.tracking || {};
            
            await supabase.from('sales').upsert({
              project_id,
              user_id: user.id,
              kiwify_sale_id: sale.id,
              product_id: sale.product_id,
              product_name: sale.product_name,
              amount: sale.amount / 100,
              status: sale.status,
              payment_method: sale.payment_method,
              customer_email: sale.customer?.email,
              customer_name: sale.customer?.name,
              utm_source: tracking.utm_source,
              utm_medium: tracking.utm_medium,
              utm_campaign: tracking.utm_campaign,
              utm_content: tracking.utm_content,
              utm_term: tracking.utm_term,
              sale_date: sale.created_at,
            }, { onConflict: 'kiwify_sale_id,project_id' });
            
            salesSynced++;
          }
        }
      }
    }

    // Sync Meta Ads spend
    if (meta && project.meta_campaign_ids?.length > 0) {
      const creds = meta.credentials as { access_token: string; ad_account_id: string };
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      for (const campaignId of project.meta_campaign_ids) {
        const url = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=campaign_name,spend,impressions,clicks&time_range={"since":"${thirtyDaysAgo}","until":"${today}"}&time_increment=1&access_token=${creds.access_token}`;
        
        const res = await fetch(url);
        if (res.ok) {
          const { data } = await res.json();
          
          for (const day of data || []) {
            await supabase.from('ad_spend').upsert({
              project_id,
              user_id: user.id,
              campaign_id: campaignId,
              campaign_name: day.campaign_name,
              spend: parseFloat(day.spend || 0),
              impressions: parseInt(day.impressions || 0),
              clicks: parseInt(day.clicks || 0),
              date: day.date_start,
            }, { onConflict: 'campaign_id,date,project_id' });
            
            adsSynced++;
          }
        }
      }
    }

    console.log(`Synced: ${salesSynced} sales, ${adsSynced} ad records`);

    return new Response(
      JSON.stringify({ success: true, salesSynced, adsSynced }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
