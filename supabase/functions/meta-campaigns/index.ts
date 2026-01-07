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

    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('user_id', user.id)
      .eq('type', 'meta_ads')
      .eq('is_active', true)
      .single();

    if (!integration) throw new Error('Meta Ads not connected');

    const creds = integration.credentials as { access_token: string; ad_account_id: string };

    const url = `https://graph.facebook.com/v18.0/${creds.ad_account_id}/campaigns?fields=id,name,status&access_token=${creds.access_token}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error('Failed to fetch campaigns');
    const { data: campaigns } = await res.json();

    return new Response(
      JSON.stringify({ campaigns: campaigns || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, campaigns: [] }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
