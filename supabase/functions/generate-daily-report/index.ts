import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to get date in Brasilia timezone (UTC-3)
function getBrasiliaDate(daysAgo = 0): string {
  const now = new Date();
  // Brasilia is UTC-3
  const brasiliaOffset = -3 * 60; // in minutes
  const utcOffset = now.getTimezoneOffset(); // in minutes
  const totalOffset = brasiliaOffset + utcOffset;
  
  const brasilia = new Date(now.getTime() + totalOffset * 60 * 1000);
  brasilia.setDate(brasilia.getDate() - daysAgo);
  
  return brasilia.toISOString().split('T')[0];
}

// Default benchmarks (market standards)
const DEFAULT_BENCHMARKS = {
  engagement: 2.0,    // Tx. Engajamento Criativo >= 2%
  ctr: 1.0,           // CTR (Link) >= 1%
  lpRate: 70.0,       // Taxa LP/Clique >= 70%
  checkoutRate: 5.0,  // Tx. Conv. Checkout >= 5%
  saleRate: 2.0,      // Taxa Venda/LP >= 2%
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { project_id, trigger } = body;

    // If triggered by cron, generate reports for all public projects
    if (trigger === 'cron') {
      console.log('Cron trigger: generating reports for all public projects');
      
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('is_public', true);

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        throw projectsError;
      }

      console.log(`Found ${projects?.length || 0} public projects`);

      const results = [];
      for (const project of projects || []) {
        try {
          const result = await generateReportForProject(supabase, project.id, lovableApiKey);
          results.push({ project_id: project.id, success: true, result });
        } catch (error) {
          console.error(`Error generating report for project ${project.id}:`, error);
          results.push({ project_id: project.id, success: false, error: String(error) });
        }
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Single project report generation
    if (!project_id) {
      throw new Error('project_id is required');
    }
    
    // Validate project_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof project_id !== 'string' || !uuidRegex.test(project_id)) {
      throw new Error('Invalid project_id format');
    }

    const result = await generateReportForProject(supabase, project_id, lovableApiKey);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-daily-report:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateReportForProject(
  supabase: any,
  projectId: string,
  lovableApiKey: string
) {
  const today = getBrasiliaDate(0);
  const yesterday = getBrasiliaDate(1);
  const dayBeforeYesterday = getBrasiliaDate(2);

  console.log(`Generating report for project ${projectId}`);
  console.log(`Today (Brasilia): ${today}, Yesterday: ${yesterday}`);

  // Fetch project details (including benchmarks)
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const projectData = project as any;

  // Get project benchmarks (use defaults if not set)
  const benchmarks = {
    engagement: projectData.benchmark_engagement ?? DEFAULT_BENCHMARKS.engagement,
    ctr: projectData.benchmark_ctr ?? DEFAULT_BENCHMARKS.ctr,
    lpRate: projectData.benchmark_lp_rate ?? DEFAULT_BENCHMARKS.lpRate,
    checkoutRate: projectData.benchmark_checkout_rate ?? DEFAULT_BENCHMARKS.checkoutRate,
    saleRate: projectData.benchmark_sale_rate ?? DEFAULT_BENCHMARKS.saleRate,
  };

  // Fetch yesterday's sales
  const { data: yesterdaySales, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .eq('project_id', projectId)
    .gte('sale_date', `${yesterday}T00:00:00`)
    .lt('sale_date', `${today}T00:00:00`);

  if (salesError) {
    console.error('Error fetching sales:', salesError);
  }

  // Fetch day before yesterday's sales for comparison
  const { data: dayBeforeSales } = await supabase
    .from('sales')
    .select('*')
    .eq('project_id', projectId)
    .gte('sale_date', `${dayBeforeYesterday}T00:00:00`)
    .lt('sale_date', `${yesterday}T00:00:00`);

  // Fetch yesterday's ad spend
  const { data: yesterdayAdSpend, error: adError } = await supabase
    .from('ad_spend')
    .select('*')
    .eq('project_id', projectId)
    .eq('date', yesterday);

  if (adError) {
    console.error('Error fetching ad spend:', adError);
  }

  // Fetch day before yesterday's ad spend
  const { data: dayBeforeAdSpend } = await supabase
    .from('ad_spend')
    .select('*')
    .eq('project_id', projectId)
    .eq('date', dayBeforeYesterday);

  // Filter by project settings
  const productIds = projectData.kiwify_product_ids || [];
  const campaignIds = projectData.meta_campaign_ids || [];

  const filterSales = (sales: any[]) => 
    productIds.length > 0 ? sales?.filter(s => productIds.includes(s.product_id)) : sales;
  
  const filterAdSpend = (adSpend: any[]) =>
    campaignIds.length > 0 ? adSpend?.filter(a => campaignIds.includes(a.campaign_id)) : adSpend;

  const filteredYesterdaySales = filterSales(yesterdaySales || []) || [];
  const filteredDayBeforeSales = filterSales(dayBeforeSales || []) || [];
  const filteredYesterdayAdSpend = filterAdSpend(yesterdayAdSpend || []) || [];
  const filteredDayBeforeAdSpend = filterAdSpend(dayBeforeAdSpend || []) || [];

  // ========== FUNNEL METRICS ==========
  // Yesterday's funnel data
  const yImpressions = filteredYesterdayAdSpend.reduce((sum, a) => sum + Number(a.impressions || 0), 0);
  const yLinkClicks = filteredYesterdayAdSpend.reduce((sum, a) => sum + Number(a.link_clicks || 0), 0);
  const yLpViews = filteredYesterdayAdSpend.reduce((sum, a) => sum + Number(a.landing_page_views || 0), 0);
  const yCheckouts = filteredYesterdayAdSpend.reduce((sum, a) => sum + Number(a.checkouts_initiated || 0), 0);
  const ySalesCount = filteredYesterdaySales.length;
  const yThruplays = filteredYesterdayAdSpend.reduce((sum, a) => sum + Number(a.thruplays || 0), 0);
  const yRevenue = filteredYesterdaySales.reduce((sum, s) => sum + Number(s.amount), 0);
  const ySpend = filteredYesterdayAdSpend.reduce((sum, a) => sum + Number(a.spend), 0);

  // Day before funnel data
  const dbImpressions = filteredDayBeforeAdSpend.reduce((sum, a) => sum + Number(a.impressions || 0), 0);
  const dbLinkClicks = filteredDayBeforeAdSpend.reduce((sum, a) => sum + Number(a.link_clicks || 0), 0);
  const dbLpViews = filteredDayBeforeAdSpend.reduce((sum, a) => sum + Number(a.landing_page_views || 0), 0);
  const dbCheckouts = filteredDayBeforeAdSpend.reduce((sum, a) => sum + Number(a.checkouts_initiated || 0), 0);
  const dbSalesCount = filteredDayBeforeSales.length;
  const dbRevenue = filteredDayBeforeSales.reduce((sum, s) => sum + Number(s.amount), 0);
  const dbSpend = filteredDayBeforeAdSpend.reduce((sum, a) => sum + Number(a.spend), 0);

  // Calculate the 5 funnel rates for yesterday
  // 1. Tx. Engajamento Criativo = (ThruPlays ou Cliques) / Impressões
  const yEngagementRate = yImpressions > 0 ? (yLinkClicks / yImpressions) * 100 : 0;
  // 2. CTR (Link) = Link Clicks / Impressões
  const yCtrRate = yImpressions > 0 ? (yLinkClicks / yImpressions) * 100 : 0;
  // 3. Taxa LP/Clique = LP Views / Link Clicks
  const yLpRate = yLinkClicks > 0 ? (yLpViews / yLinkClicks) * 100 : 0;
  // 4. Tx. Conv. Checkout = Checkouts / LP Views
  const yCheckoutRate = yLpViews > 0 ? (yCheckouts / yLpViews) * 100 : 0;
  // 5. Taxa Venda/LP = Vendas / LP Views
  const ySaleRate = yLpViews > 0 ? (ySalesCount / yLpViews) * 100 : 0;

  // Calculate the 5 funnel rates for day before
  const dbEngagementRate = dbImpressions > 0 ? (dbLinkClicks / dbImpressions) * 100 : 0;
  const dbCtrRate = dbImpressions > 0 ? (dbLinkClicks / dbImpressions) * 100 : 0;
  const dbLpRate = dbLinkClicks > 0 ? (dbLpViews / dbLinkClicks) * 100 : 0;
  const dbCheckoutRate = dbLpViews > 0 ? (dbCheckouts / dbLpViews) * 100 : 0;
  const dbSaleRate = dbLpViews > 0 ? (dbSalesCount / dbLpViews) * 100 : 0;

  // Determine status for each metric (ok or alert)
  const funnelStatus = {
    engagement: yEngagementRate >= benchmarks.engagement ? 'ok' : 'alert',
    ctr: yCtrRate >= benchmarks.ctr ? 'ok' : 'alert',
    lpRate: yLpRate >= benchmarks.lpRate ? 'ok' : 'alert',
    checkoutRate: yCheckoutRate >= benchmarks.checkoutRate ? 'ok' : 'alert',
    saleRate: ySaleRate >= benchmarks.saleRate ? 'ok' : 'alert',
  };

  // Calculate changes from day before
  const calcChange = (current: number, previous: number) => 
    previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);

  const funnelComparison = {
    engagement: { yesterday: yEngagementRate, dayBefore: dbEngagementRate, change: calcChange(yEngagementRate, dbEngagementRate) },
    ctr: { yesterday: yCtrRate, dayBefore: dbCtrRate, change: calcChange(yCtrRate, dbCtrRate) },
    lpRate: { yesterday: yLpRate, dayBefore: dbLpRate, change: calcChange(yLpRate, dbLpRate) },
    checkoutRate: { yesterday: yCheckoutRate, dayBefore: dbCheckoutRate, change: calcChange(yCheckoutRate, dbCheckoutRate) },
    saleRate: { yesterday: ySaleRate, dayBefore: dbSaleRate, change: calcChange(ySaleRate, dbSaleRate) },
    revenue: { yesterday: yRevenue, dayBefore: dbRevenue, change: calcChange(yRevenue, dbRevenue) },
    spend: { yesterday: ySpend, dayBefore: dbSpend, change: calcChange(ySpend, dbSpend) },
    sales: { yesterday: ySalesCount, dayBefore: dbSalesCount, change: calcChange(ySalesCount, dbSalesCount) },
  };

  // ROAS and CPA
  const yRoas = ySpend > 0 ? yRevenue / ySpend : 0;
  const yCpa = ySalesCount > 0 ? ySpend / ySalesCount : 0;
  const dbRoas = dbSpend > 0 ? dbRevenue / dbSpend : 0;
  const dbCpa = dbSalesCount > 0 ? dbSpend / dbSalesCount : 0;

  // Build funnel metrics object
  const funnelMetrics = {
    // Raw numbers
    impressions: yImpressions,
    linkClicks: yLinkClicks,
    lpViews: yLpViews,
    checkouts: yCheckouts,
    sales: ySalesCount,
    thruplays: yThruplays,
    revenue: yRevenue,
    spend: ySpend,
    roas: yRoas,
    cpa: yCpa,
    // Calculated rates
    rates: {
      engagement: yEngagementRate,
      ctr: yCtrRate,
      lpRate: yLpRate,
      checkoutRate: yCheckoutRate,
      saleRate: ySaleRate,
    },
    // Benchmarks used
    benchmarks,
    // Status for each metric
    status: funnelStatus,
  };

  // Generate AI summary focused on funnel metrics
  const prompt = `Você é um analista de performance de marketing digital especializado em funil de vendas.

DADOS DO DIA ${yesterday} - PROJETO: ${projectData.name}

=== MÉTRICAS DE FUNIL ===

1. Tx. Engajamento Criativo: ${yEngagementRate.toFixed(2)}% (benchmark: ${benchmarks.engagement}%)
   → ${funnelStatus.engagement === 'ok' ? '✅ DENTRO DO ESPERADO' : '⚠️ ABAIXO DO BENCHMARK'}
   → Variação: ${funnelComparison.engagement.change > 0 ? '+' : ''}${funnelComparison.engagement.change.toFixed(1)}% vs ontem

2. CTR (Link Clicks): ${yCtrRate.toFixed(2)}% (benchmark: ${benchmarks.ctr}%)
   → ${funnelStatus.ctr === 'ok' ? '✅ DENTRO DO ESPERADO' : '⚠️ ABAIXO DO BENCHMARK'}
   → Variação: ${funnelComparison.ctr.change > 0 ? '+' : ''}${funnelComparison.ctr.change.toFixed(1)}% vs ontem

3. Taxa LP/Clique: ${yLpRate.toFixed(2)}% (benchmark: ${benchmarks.lpRate}%)
   → ${funnelStatus.lpRate === 'ok' ? '✅ DENTRO DO ESPERADO' : '⚠️ ABAIXO DO BENCHMARK'}
   → Variação: ${funnelComparison.lpRate.change > 0 ? '+' : ''}${funnelComparison.lpRate.change.toFixed(1)}% vs ontem

4. Tx. Conv. Checkout: ${yCheckoutRate.toFixed(2)}% (benchmark: ${benchmarks.checkoutRate}%)
   → ${funnelStatus.checkoutRate === 'ok' ? '✅ DENTRO DO ESPERADO' : '⚠️ ABAIXO DO BENCHMARK'}
   → Variação: ${funnelComparison.checkoutRate.change > 0 ? '+' : ''}${funnelComparison.checkoutRate.change.toFixed(1)}% vs ontem

5. Taxa Venda/LP: ${ySaleRate.toFixed(2)}% (benchmark: ${benchmarks.saleRate}%)
   → ${funnelStatus.saleRate === 'ok' ? '✅ DENTRO DO ESPERADO' : '⚠️ ABAIXO DO BENCHMARK'}
   → Variação: ${funnelComparison.saleRate.change > 0 ? '+' : ''}${funnelComparison.saleRate.change.toFixed(1)}% vs ontem

=== DADOS ABSOLUTOS ===
- Impressões: ${yImpressions.toLocaleString()}
- Link Clicks: ${yLinkClicks.toLocaleString()}
- LP Views: ${yLpViews.toLocaleString()}
- Checkouts: ${yCheckouts.toLocaleString()}
- Vendas: ${ySalesCount}
- Receita: R$ ${yRevenue.toFixed(2)}
- Gasto: R$ ${ySpend.toFixed(2)}
- ROAS: ${yRoas.toFixed(2)}x
- CPA: R$ ${yCpa.toFixed(2)}

=== INSTRUÇÕES ===
1. Analise cada etapa do funil e identifique onde está o gargalo (métrica mais fraca).
2. Gere recomendações específicas para melhorar as métricas que estão abaixo do benchmark.
3. Priorize ações para o gargalo principal.
4. Seja direto e objetivo - o cliente precisa de insights acionáveis.

Formato de resposta (JSON):
{
  "summary": "Resumo de 2-3 frases focando no gargalo do funil e performance geral",
  "bottleneck": "nome da métrica que é o maior gargalo (engagement, ctr, lpRate, checkoutRate ou saleRate)",
  "actions": [
    {"action": "Ação específica para o gargalo", "priority": "alta"},
    {"action": "Ação secundária", "priority": "média"},
    {"action": "Ação complementar", "priority": "baixa"}
  ]
}`;

  console.log('Calling Lovable AI for funnel-focused report generation...');

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'Você é um analista de marketing digital especializado em funil de vendas. Responda sempre em JSON válido. Foque nas métricas de funil e identifique gargalos.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('AI API error:', aiResponse.status, errorText);
    
    if (aiResponse.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (aiResponse.status === 402) {
      throw new Error('Payment required. Please add credits to your workspace.');
    }
    throw new Error(`AI API error: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const aiContent = aiData.choices?.[0]?.message?.content;

  let parsedAiResponse;
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedAiResponse = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in AI response');
    }
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    parsedAiResponse = {
      summary: aiContent || 'Relatório gerado com sucesso.',
      bottleneck: null,
      actions: [],
    };
  }

  // Save report to database
  const { data: report, error: insertError } = await supabase
    .from('daily_reports')
    .upsert({
      project_id: projectId,
      report_date: yesterday,
      summary: parsedAiResponse.summary,
      comparison: funnelComparison,
      actions: parsedAiResponse.actions || [],
      metrics: funnelMetrics,
    }, {
      onConflict: 'project_id,report_date',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error saving report:', insertError);
    throw insertError;
  }

  console.log(`Report saved for project ${projectId}, date ${yesterday}`);

  return {
    success: true,
    report_id: report.id,
    report_date: yesterday,
    summary: parsedAiResponse.summary,
    bottleneck: parsedAiResponse.bottleneck,
    funnel: funnelMetrics,
  };
}
