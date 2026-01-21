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
  // Get dates for the last 3 days (excluding today)
  const today = getBrasiliaDate(0);
  const day1 = getBrasiliaDate(1); // yesterday
  const day2 = getBrasiliaDate(2); // 2 days ago
  const day3 = getBrasiliaDate(3); // 3 days ago

  console.log(`Generating report for project ${projectId}`);
  console.log(`Today (Brasilia): ${today}, Analyzing days: ${day1}, ${day2}, ${day3}`);

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

  // Fetch sales for all 3 days
  const { data: allSales, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .eq('project_id', projectId)
    .gte('sale_date', `${day3}T00:00:00`)
    .lt('sale_date', `${today}T00:00:00`);

  if (salesError) {
    console.error('Error fetching sales:', salesError);
  }

  // Fetch ad spend for all 3 days
  const { data: allAdSpend, error: adError } = await supabase
    .from('ad_spend')
    .select('*')
    .eq('project_id', projectId)
    .gte('date', day3)
    .lte('date', day1);

  if (adError) {
    console.error('Error fetching ad spend:', adError);
  }

  // Filter by project settings
  const productIds = projectData.kiwify_product_ids || [];
  const campaignIds = projectData.meta_campaign_ids || [];

  const filterSales = (sales: any[], targetDate: string) => {
    const filtered = sales?.filter(s => {
      const saleDate = s.sale_date.split('T')[0];
      return saleDate === targetDate && (!productIds.length || productIds.includes(s.product_id));
    }) || [];
    return filtered;
  };
  
  const filterAdSpend = (adSpend: any[], targetDate: string) => {
    const filtered = adSpend?.filter(a => {
      return a.date === targetDate && (!campaignIds.length || campaignIds.includes(a.campaign_id));
    }) || [];
    return filtered;
  };

  // Get data for each of the 3 days
  const day1Sales = filterSales(allSales || [], day1);
  const day2Sales = filterSales(allSales || [], day2);
  const day3Sales = filterSales(allSales || [], day3);

  const day1AdSpend = filterAdSpend(allAdSpend || [], day1);
  const day2AdSpend = filterAdSpend(allAdSpend || [], day2);
  const day3AdSpend = filterAdSpend(allAdSpend || [], day3);

  // Calculate metrics for each day
  const calcDayMetrics = (sales: any[], adSpend: any[]) => {
    const impressions = adSpend.reduce((sum, a) => sum + Number(a.impressions || 0), 0);
    const linkClicks = adSpend.reduce((sum, a) => sum + Number(a.link_clicks || 0), 0);
    const lpViews = adSpend.reduce((sum, a) => sum + Number(a.landing_page_views || 0), 0);
    const checkouts = adSpend.reduce((sum, a) => sum + Number(a.checkouts_initiated || 0), 0);
    const salesCount = sales.length;
    const thruplays = adSpend.reduce((sum, a) => sum + Number(a.thruplays || 0), 0);
    const revenue = sales.reduce((sum, s) => sum + Number(s.amount), 0);
    const spend = adSpend.reduce((sum, a) => sum + Number(a.spend), 0);

    const engagementRate = impressions > 0 ? (linkClicks / impressions) * 100 : 0;
    const ctrRate = impressions > 0 ? (linkClicks / impressions) * 100 : 0;
    const lpRate = linkClicks > 0 ? (lpViews / linkClicks) * 100 : 0;
    const checkoutRate = lpViews > 0 ? (checkouts / lpViews) * 100 : 0;
    const saleRate = lpViews > 0 ? (salesCount / lpViews) * 100 : 0;
    const roas = spend > 0 ? revenue / spend : 0;
    const cpa = salesCount > 0 ? spend / salesCount : 0;

    return {
      impressions, linkClicks, lpViews, checkouts, salesCount, thruplays, revenue, spend,
      engagementRate, ctrRate, lpRate, checkoutRate, saleRate, roas, cpa
    };
  };

  const d1 = calcDayMetrics(day1Sales, day1AdSpend);
  const d2 = calcDayMetrics(day2Sales, day2AdSpend);
  const d3 = calcDayMetrics(day3Sales, day3AdSpend);

  // Calculate 3-day averages for trend analysis
  const avg3Days = {
    engagementRate: (d1.engagementRate + d2.engagementRate + d3.engagementRate) / 3,
    ctrRate: (d1.ctrRate + d2.ctrRate + d3.ctrRate) / 3,
    lpRate: (d1.lpRate + d2.lpRate + d3.lpRate) / 3,
    checkoutRate: (d1.checkoutRate + d2.checkoutRate + d3.checkoutRate) / 3,
    saleRate: (d1.saleRate + d2.saleRate + d3.saleRate) / 3,
    revenue: (d1.revenue + d2.revenue + d3.revenue) / 3,
    spend: (d1.spend + d2.spend + d3.spend) / 3,
    roas: (d1.roas + d2.roas + d3.roas) / 3,
    cpa: (d1.cpa + d2.cpa + d3.cpa) / 3,
    salesCount: (d1.salesCount + d2.salesCount + d3.salesCount) / 3,
  };

  // Determine trends (comparing day1 to day3)
  const calcTrend = (recent: number, old: number) => {
    if (old === 0) return recent > 0 ? 'subindo' : 'estável';
    const change = ((recent - old) / old) * 100;
    if (change > 10) return 'subindo';
    if (change < -10) return 'caindo';
    return 'estável';
  };

  const trends = {
    engagement: calcTrend(d1.engagementRate, d3.engagementRate),
    ctr: calcTrend(d1.ctrRate, d3.ctrRate),
    lpRate: calcTrend(d1.lpRate, d3.lpRate),
    checkoutRate: calcTrend(d1.checkoutRate, d3.checkoutRate),
    saleRate: calcTrend(d1.saleRate, d3.saleRate),
    revenue: calcTrend(d1.revenue, d3.revenue),
    roas: calcTrend(d1.roas, d3.roas),
  };

  // Determine status for each metric (ok or alert based on 3-day average)
  const funnelStatus = {
    engagement: avg3Days.engagementRate >= benchmarks.engagement ? 'ok' : 'alert',
    ctr: avg3Days.ctrRate >= benchmarks.ctr ? 'ok' : 'alert',
    lpRate: avg3Days.lpRate >= benchmarks.lpRate ? 'ok' : 'alert',
    checkoutRate: avg3Days.checkoutRate >= benchmarks.checkoutRate ? 'ok' : 'alert',
    saleRate: avg3Days.saleRate >= benchmarks.saleRate ? 'ok' : 'alert',
  };

  // Calculate changes from day before for yesterday
  const calcChange = (current: number, previous: number) => 
    previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);

  const funnelComparison = {
    engagement: { yesterday: d1.engagementRate, dayBefore: d2.engagementRate, change: calcChange(d1.engagementRate, d2.engagementRate) },
    ctr: { yesterday: d1.ctrRate, dayBefore: d2.ctrRate, change: calcChange(d1.ctrRate, d2.ctrRate) },
    lpRate: { yesterday: d1.lpRate, dayBefore: d2.lpRate, change: calcChange(d1.lpRate, d2.lpRate) },
    checkoutRate: { yesterday: d1.checkoutRate, dayBefore: d2.checkoutRate, change: calcChange(d1.checkoutRate, d2.checkoutRate) },
    saleRate: { yesterday: d1.saleRate, dayBefore: d2.saleRate, change: calcChange(d1.saleRate, d2.saleRate) },
    revenue: { yesterday: d1.revenue, dayBefore: d2.revenue, change: calcChange(d1.revenue, d2.revenue) },
    spend: { yesterday: d1.spend, dayBefore: d2.spend, change: calcChange(d1.spend, d2.spend) },
    sales: { yesterday: d1.salesCount, dayBefore: d2.salesCount, change: calcChange(d1.salesCount, d2.salesCount) },
  };

  // Build funnel metrics object (for yesterday)
  const funnelMetrics = {
    impressions: d1.impressions,
    linkClicks: d1.linkClicks,
    lpViews: d1.lpViews,
    checkouts: d1.checkouts,
    sales: d1.salesCount,
    thruplays: d1.thruplays,
    revenue: d1.revenue,
    spend: d1.spend,
    roas: d1.roas,
    cpa: d1.cpa,
    rates: {
      engagement: d1.engagementRate,
      ctr: d1.ctrRate,
      lpRate: d1.lpRate,
      checkoutRate: d1.checkoutRate,
      saleRate: d1.saleRate,
    },
    benchmarks,
    status: funnelStatus,
  };

  // Generate AI summary focused on 3-day trends
  const prompt = `Você é um analista de performance de marketing digital especializado em funil de vendas.

DADOS DOS ÚLTIMOS 3 DIAS (excluindo hoje) - PROJETO: ${projectData.name}

=== DIA 1 (Ontem: ${day1}) ===
- Receita: R$ ${d1.revenue.toFixed(2)}
- Gasto: R$ ${d1.spend.toFixed(2)}
- ROAS: ${d1.roas.toFixed(2)}x
- Vendas: ${d1.salesCount}
- CPA: R$ ${d1.cpa.toFixed(2)}

=== DIA 2 (${day2}) ===
- Receita: R$ ${d2.revenue.toFixed(2)}
- Gasto: R$ ${d2.spend.toFixed(2)}
- ROAS: ${d2.roas.toFixed(2)}x
- Vendas: ${d2.salesCount}

=== DIA 3 (${day3}) ===
- Receita: R$ ${d3.revenue.toFixed(2)}
- Gasto: R$ ${d3.spend.toFixed(2)}
- ROAS: ${d3.roas.toFixed(2)}x
- Vendas: ${d3.salesCount}

=== TENDÊNCIAS (últimos 3 dias) ===
- Receita: ${trends.revenue}
- ROAS: ${trends.roas}
- Engajamento: ${trends.engagement}
- CTR: ${trends.ctr}
- Taxa LP/Clique: ${trends.lpRate}
- Taxa Checkout: ${trends.checkoutRate}
- Taxa Venda: ${trends.saleRate}

=== MÉDIAS (3 dias) ===
- Receita Média: R$ ${avg3Days.revenue.toFixed(2)}
- Gasto Médio: R$ ${avg3Days.spend.toFixed(2)}
- ROAS Médio: ${avg3Days.roas.toFixed(2)}x
- CPA Médio: R$ ${avg3Days.cpa.toFixed(2)}
- Vendas Média: ${avg3Days.salesCount.toFixed(1)}

=== MÉTRICAS DE FUNIL (Média 3 dias vs Benchmarks) ===
1. Tx. Engajamento: ${avg3Days.engagementRate.toFixed(2)}% (benchmark: ${benchmarks.engagement}%) → ${funnelStatus.engagement === 'ok' ? '✅ OK' : '⚠️ ALERTA'}
2. CTR: ${avg3Days.ctrRate.toFixed(2)}% (benchmark: ${benchmarks.ctr}%) → ${funnelStatus.ctr === 'ok' ? '✅ OK' : '⚠️ ALERTA'}
3. Taxa LP/Clique: ${avg3Days.lpRate.toFixed(2)}% (benchmark: ${benchmarks.lpRate}%) → ${funnelStatus.lpRate === 'ok' ? '✅ OK' : '⚠️ ALERTA'}
4. Taxa Checkout: ${avg3Days.checkoutRate.toFixed(2)}% (benchmark: ${benchmarks.checkoutRate}%) → ${funnelStatus.checkoutRate === 'ok' ? '✅ OK' : '⚠️ ALERTA'}
5. Taxa Venda: ${avg3Days.saleRate.toFixed(2)}% (benchmark: ${benchmarks.saleRate}%) → ${funnelStatus.saleRate === 'ok' ? '✅ OK' : '⚠️ ALERTA'}

=== INSTRUÇÕES ===
1. Analise a TENDÊNCIA dos últimos 3 dias (melhorando, piorando ou estável).
2. Identifique problemas PERSISTENTES (que aparecem em mais de um dia).
3. Gere um resumo focado no que o cliente precisa saber.
4. Priorize ações para problemas que estão PIORANDO ou são consistentes.
5. Seja direto e objetivo - o cliente precisa de insights acionáveis.

Formato de resposta (JSON):
{
  "summary": "Resumo de 2-3 frases sobre a performance dos últimos 3 dias, destacando tendências",
  "bottleneck": "nome da métrica que é o maior problema persistente",
  "actions": [
    {"action": "Ação específica para o problema principal", "priority": "alta"},
    {"action": "Ação secundária baseada em tendência", "priority": "média"},
    {"action": "Ação complementar", "priority": "baixa"}
  ]
}`;

  console.log('Calling Lovable AI for 3-day trend analysis...');

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'Você é um analista de marketing digital. Responda sempre em JSON válido. Foque em tendências de 3 dias e problemas persistentes.' },
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

  // Save report to database (for yesterday's date)
  const { data: report, error: insertError } = await supabase
    .from('daily_reports')
    .upsert({
      project_id: projectId,
      report_date: day1,
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

  console.log(`Report saved for project ${projectId}, date ${day1}`);

  return {
    success: true,
    report_id: report.id,
    report_date: day1,
    summary: parsedAiResponse.summary,
    bottleneck: parsedAiResponse.bottleneck,
    funnel: funnelMetrics,
    trends,
  };
}
