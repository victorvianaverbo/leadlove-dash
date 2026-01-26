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

// Converte meia-noite de Brasília para UTC (+3 horas)
function brasiliaToUTC(dateStr: string): string {
  return `${dateStr}T03:00:00.000Z`;
}

// Converte timestamp UTC para data em Brasília (subtrai 3 horas)
function utcToBrasiliaDate(utcTimestamp: string): string {
  const date = new Date(utcTimestamp);
  // Subtrai 3 horas para converter UTC para Brasília
  date.setHours(date.getHours() - 3);
  return date.toISOString().split('T')[0];
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
    .gte('sale_date', brasiliaToUTC(day3))
    .lt('sale_date', brasiliaToUTC(today));

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
      // Converte timestamp UTC para data em Brasília
      const saleDate = utcToBrasiliaDate(s.sale_date);
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
  // Usar gross_amount quando use_gross_for_roas está ativado
  const useGrossForRevenue = projectData.use_gross_for_roas || false;
  
  const calcDayMetrics = (sales: any[], adSpend: any[]) => {
    const impressions = adSpend.reduce((sum, a) => sum + Number(a.impressions || 0), 0);
    const linkClicks = adSpend.reduce((sum, a) => sum + Number(a.link_clicks || 0), 0);
    const lpViews = adSpend.reduce((sum, a) => sum + Number(a.landing_page_views || 0), 0);
    const checkouts = adSpend.reduce((sum, a) => sum + Number(a.checkouts_initiated || 0), 0);
    const salesCount = sales.length;
    const thruplays = adSpend.reduce((sum, a) => sum + Number(a.thruplays || 0), 0);
    const video3sViews = adSpend.reduce((sum, a) => sum + Number(a.video_3s_views || 0), 0);
    
    // Novas métricas de vídeo para análise de funil
    const videoP25Views = adSpend.reduce((sum, a) => sum + Number(a.video_p25_views || 0), 0);
    const videoP50Views = adSpend.reduce((sum, a) => sum + Number(a.video_p50_views || 0), 0);
    const videoP75Views = adSpend.reduce((sum, a) => sum + Number(a.video_p75_views || 0), 0);
    const videoP100Views = adSpend.reduce((sum, a) => sum + Number(a.video_p100_views || 0), 0);
    
    // Usar gross_amount quando configurado para coprodução
    const revenue = sales.reduce((sum, s) => {
      const value = useGrossForRevenue ? (Number(s.gross_amount) || Number(s.amount)) : Number(s.amount);
      return sum + value;
    }, 0);
    
    const spend = adSpend.reduce((sum, a) => sum + Number(a.spend), 0);

    // Taxas de funil existentes
    const engagementRate = impressions > 0 ? (linkClicks / impressions) * 100 : 0;
    const ctrRate = impressions > 0 ? (linkClicks / impressions) * 100 : 0;
    const lpRate = linkClicks > 0 ? (lpViews / linkClicks) * 100 : 0;
    const checkoutRate = lpViews > 0 ? (checkouts / lpViews) * 100 : 0;
    const saleRate = lpViews > 0 ? (salesCount / lpViews) * 100 : 0;
    const roas = spend > 0 ? revenue / spend : 0;
    const cpa = salesCount > 0 ? spend / salesCount : 0;
    
    // Novas métricas de engajamento de vídeo (PRD v2.0)
    const hookRate = impressions > 0 ? (video3sViews / impressions) * 100 : 0;
    const holdRate = videoP25Views > 0 ? (videoP75Views / videoP25Views) * 100 : 0;
    const closeRate = videoP75Views > 0 ? (videoP100Views / videoP75Views) * 100 : 0;
    const connectRate = linkClicks > 0 ? (lpViews / linkClicks) * 100 : 0;
    const cpmValue = impressions > 0 ? (spend / impressions) * 1000 : 0;

    return {
      impressions, linkClicks, lpViews, checkouts, salesCount, thruplays, revenue, spend,
      engagementRate, ctrRate, lpRate, checkoutRate, saleRate, roas, cpa,
      // Novas métricas de vídeo
      video3sViews, videoP25Views, videoP50Views, videoP75Views, videoP100Views,
      hookRate, holdRate, closeRate, connectRate, cpmValue
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
    // Novas métricas de vídeo
    hookRate: (d1.hookRate + d2.hookRate + d3.hookRate) / 3,
    holdRate: (d1.holdRate + d2.holdRate + d3.holdRate) / 3,
    closeRate: (d1.closeRate + d2.closeRate + d3.closeRate) / 3,
    connectRate: (d1.connectRate + d2.connectRate + d3.connectRate) / 3,
    cpmValue: (d1.cpmValue + d2.cpmValue + d3.cpmValue) / 3,
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
    // Novas tendências de vídeo
    hookRate: calcTrend(d1.hookRate, d3.hookRate),
    holdRate: calcTrend(d1.holdRate, d3.holdRate),
    closeRate: calcTrend(d1.closeRate, d3.closeRate),
    connectRate: calcTrend(d1.connectRate, d3.connectRate),
    cpm: calcTrend(d1.cpmValue, d3.cpmValue),
  };

  // Benchmarks de vídeo (PRD v2.0)
  const videoBenchmarks = {
    hookRate: { critical: 20, attention: 35, good: 50 },
    holdRate: { critical: 40, attention: 60, good: 75 },
    closeRate: { critical: 50, attention: 70, good: 85 },
    connectRate: { critical: 60, attention: 75, good: 90 },
  };

  // Função para determinar status de métrica de vídeo
  const getVideoStatus = (value: number, bench: { critical: number; attention: number; good: number }) => {
    if (value < bench.critical) return 'critical';
    if (value < bench.attention) return 'attention';
    if (value < bench.good) return 'good';
    return 'excellent';
  };

  // Determine status for each metric (ok or alert based on 3-day average)
  const funnelStatus = {
    engagement: avg3Days.engagementRate >= benchmarks.engagement ? 'ok' : 'alert',
    ctr: avg3Days.ctrRate >= benchmarks.ctr ? 'ok' : 'alert',
    lpRate: avg3Days.lpRate >= benchmarks.lpRate ? 'ok' : 'alert',
    checkoutRate: avg3Days.checkoutRate >= benchmarks.checkoutRate ? 'ok' : 'alert',
    saleRate: avg3Days.saleRate >= benchmarks.saleRate ? 'ok' : 'alert',
    // Novas métricas de vídeo
    hookRate: getVideoStatus(avg3Days.hookRate, videoBenchmarks.hookRate),
    holdRate: getVideoStatus(avg3Days.holdRate, videoBenchmarks.holdRate),
    closeRate: getVideoStatus(avg3Days.closeRate, videoBenchmarks.closeRate),
    connectRate: getVideoStatus(avg3Days.connectRate, videoBenchmarks.connectRate),
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

  // Generate AI summary focused on 3-day trends with video engagement metrics
  const prompt = `Você é um analista de performance de marketing digital especializado em funil de vendas de vídeo.

DADOS DOS ÚLTIMOS 3 DIAS (excluindo hoje) - PROJETO: ${projectData.name}

=== DIA 1 (Ontem: ${day1}) ===
- Receita: R$ ${d1.revenue.toFixed(2)} | Gasto: R$ ${d1.spend.toFixed(2)} | ROAS: ${d1.roas.toFixed(2)}x | Vendas: ${d1.salesCount}
- CPM: R$ ${d1.cpmValue.toFixed(2)} | CPA: R$ ${d1.cpa.toFixed(2)}
- Hook Rate: ${d1.hookRate.toFixed(1)}% | Hold Rate: ${d1.holdRate.toFixed(1)}% | Close Rate: ${d1.closeRate.toFixed(1)}%
- Connect Rate: ${d1.connectRate.toFixed(1)}% | CTR: ${d1.ctrRate.toFixed(2)}%

=== DIA 2 (${day2}) ===
- Receita: R$ ${d2.revenue.toFixed(2)} | Gasto: R$ ${d2.spend.toFixed(2)} | ROAS: ${d2.roas.toFixed(2)}x | Vendas: ${d2.salesCount}
- Hook Rate: ${d2.hookRate.toFixed(1)}% | Hold Rate: ${d2.holdRate.toFixed(1)}% | Close Rate: ${d2.closeRate.toFixed(1)}%

=== DIA 3 (${day3}) ===
- Receita: R$ ${d3.revenue.toFixed(2)} | Gasto: R$ ${d3.spend.toFixed(2)} | ROAS: ${d3.roas.toFixed(2)}x | Vendas: ${d3.salesCount}
- Hook Rate: ${d3.hookRate.toFixed(1)}% | Hold Rate: ${d3.holdRate.toFixed(1)}% | Close Rate: ${d3.closeRate.toFixed(1)}%

=== MÉTRICAS DE VÍDEO (Média 3 dias) ===
📊 ENGAJAMENTO DE VÍDEO:
1. Hook Rate (3s / Impressões): ${avg3Days.hookRate.toFixed(1)}% → ${funnelStatus.hookRate === 'critical' ? '🔴 CRÍTICO (<20%)' : funnelStatus.hookRate === 'attention' ? '🟡 ATENÇÃO (20-35%)' : funnelStatus.hookRate === 'good' ? '🟢 BOM (35-50%)' : '✨ EXCELENTE (>50%)'}
   Tendência: ${trends.hookRate}
2. Hold Rate (75% / 25%): ${avg3Days.holdRate.toFixed(1)}% → ${funnelStatus.holdRate === 'critical' ? '🔴 CRÍTICO (<40%)' : funnelStatus.holdRate === 'attention' ? '🟡 ATENÇÃO (40-60%)' : funnelStatus.holdRate === 'good' ? '🟢 BOM (60-75%)' : '✨ EXCELENTE (>75%)'}
   Tendência: ${trends.holdRate}
3. Close Rate (100% / 75%): ${avg3Days.closeRate.toFixed(1)}% → ${funnelStatus.closeRate === 'critical' ? '🔴 CRÍTICO (<50%)' : funnelStatus.closeRate === 'attention' ? '🟡 ATENÇÃO (50-70%)' : funnelStatus.closeRate === 'good' ? '🟢 BOM (70-85%)' : '✨ EXCELENTE (>85%)'}
   Tendência: ${trends.closeRate}

📊 CONEXÃO E CONVERSÃO:
4. Connect Rate (LP / Cliques): ${avg3Days.connectRate.toFixed(1)}% → ${funnelStatus.connectRate === 'critical' ? '🔴 CRÍTICO (<60%)' : funnelStatus.connectRate === 'attention' ? '🟡 ATENÇÃO (60-75%)' : funnelStatus.connectRate === 'good' ? '🟢 BOM (75-90%)' : '✨ EXCELENTE (>90%)'}
   Tendência: ${trends.connectRate}
5. CTR (Link): ${avg3Days.ctrRate.toFixed(2)}% → ${funnelStatus.ctr === 'ok' ? '✅ OK (≥1%)' : '⚠️ BAIXO (<1%)'}
   Tendência: ${trends.ctr}
6. CPM Médio: R$ ${avg3Days.cpmValue.toFixed(2)} | Tendência: ${trends.cpm}

📊 CONVERSÃO FINAL:
7. Taxa LP → Venda: ${avg3Days.saleRate.toFixed(2)}% → ${funnelStatus.saleRate === 'ok' ? '✅ OK (≥2%)' : '⚠️ BAIXO (<2%)'}
8. Taxa Checkout: ${avg3Days.checkoutRate.toFixed(2)}% → ${funnelStatus.checkoutRate === 'ok' ? '✅ OK (≥5%)' : '⚠️ BAIXO (<5%)'}

=== RESUMO FINANCEIRO (Média 3 dias) ===
- Receita: R$ ${avg3Days.revenue.toFixed(2)} | Gasto: R$ ${avg3Days.spend.toFixed(2)}
- ROAS: ${avg3Days.roas.toFixed(2)}x | CPA: R$ ${avg3Days.cpa.toFixed(2)} | Vendas: ${avg3Days.salesCount.toFixed(1)}

=== PLANOS DE AÇÃO POR PROBLEMA ===
Use estes planos específicos baseados no problema identificado:

🔴 HOOK BAIXO (<20%): O início do vídeo não prende atenção
- Otimizar thumbnail com contraste alto e elemento de curiosidade
- Reescrever hook verbal com pergunta provocativa nos primeiros 3 segundos
- Testar pattern interrupt visual (zoom, corte rápido, texto impactante)

🔴 HOLD BAIXO (<40%): Pessoas abandonam no meio do vídeo
- Encurtar vídeo em 30-40% (remover partes sem valor)
- Adicionar cortes a cada 2-3 segundos para manter ritmo
- Criar micro-hooks no meio (curiosidade sobre o que vem a seguir)

🔴 CLOSE BAIXO (<50%): Pessoas não assistem até o final
- Fortalecer CTA com verbos de ação claros ("Clique agora", "Garanta sua vaga")
- Criar urgência e escassez genuína no final
- Reforçar CTA visualmente (animação, destaque, seta)

🔴 CONNECT RATE BAIXO (<60%): Cliques não chegam na página
- Verificar velocidade da página (deve carregar em <3s)
- Testar todos os links e redirects
- Otimizar para mobile (60%+ do tráfego)
- Verificar compatibilidade de navegadores

🔴 CTR BAIXO (<0.8%): Vídeo não gera cliques
- Mencionar CTA múltiplas vezes no vídeo (não só no final)
- Melhorar oferta com isca digital irresistível
- Qualificar melhor o público-alvo

🔴 CPM ALTO (>R$ 50 para infoprodutos): Custo por mil impressões elevado
- Expandir público-alvo (lookalike, interesses mais amplos)
- Melhorar qualidade do criativo (reduz custo)
- Ajustar estratégia de lances
- Testar outros posicionamentos (Stories, Reels)

🔴 TAXA CONVERSÃO BAIXA (<1%): Página não converte
- Otimizar copy da página (headline, benefícios, prova social)
- Adicionar elementos de confiança (depoimentos, garantia)
- Simplificar processo de compra

🔴 TAXA CHECKOUT BAIXA (<40%): Abandono no checkout
- Simplificar formulário de checkout
- Transparência total de custos (sem surpresas)
- Adicionar mais opções de pagamento
- Implementar recuperação de carrinhos abandonados

=== INSTRUÇÕES PARA ANÁLISE ===
1. Identifique o MAIOR GARGALO do funil (métrica crítica que mais impacta o ROI)
2. Analise TENDÊNCIAS dos 3 dias (piorando = prioridade alta)
3. Gere 3-5 ações ESPECÍFICAS usando os planos acima
4. Priorize por impacto no ROI (Hook/Hold afetam tudo, Close/Connect são mais específicos)

Formato de resposta (JSON):
{
  "summary": "Análise de 3-4 frases: desempenho geral, principal gargalo identificado e tendência. Mencione métricas específicas.",
  "bottleneck": "nome da métrica principal (hook_rate, hold_rate, close_rate, connect_rate, ctr, cpm, conversion_rate, checkout_rate)",
  "bottleneck_value": "valor atual da métrica",
  "bottleneck_status": "critical/attention/good/excellent",
  "actions": [
    {
      "action": "Ação específica do plano acima",
      "priority": "alta",
      "metric": "hook_rate",
      "metric_label": "Hook Rate",
      "metric_value": "15.2%",
      "benchmark": "20%",
      "reason": "Frase curta explicando por que essa métrica impacta os resultados"
    }
  ],
  "metrics_summary": {
    "hook_rate": {"value": ${avg3Days.hookRate.toFixed(1)}, "status": "${funnelStatus.hookRate}", "trend": "${trends.hookRate}", "benchmark": "20%"},
    "hold_rate": {"value": ${avg3Days.holdRate.toFixed(1)}, "status": "${funnelStatus.holdRate}", "trend": "${trends.holdRate}", "benchmark": "40%"},
    "close_rate": {"value": ${avg3Days.closeRate.toFixed(1)}, "status": "${funnelStatus.closeRate}", "trend": "${trends.closeRate}", "benchmark": "50%"},
    "connect_rate": {"value": ${avg3Days.connectRate.toFixed(1)}, "status": "${funnelStatus.connectRate}", "trend": "${trends.connectRate}", "benchmark": "60%"},
    "ctr": {"value": ${avg3Days.ctrRate.toFixed(2)}, "status": "${funnelStatus.ctr}", "trend": "${trends.ctr}", "benchmark": "${benchmarks.ctr}%"},
    "cpm": {"value": ${avg3Days.cpmValue.toFixed(2)}, "trend": "${trends.cpm}", "benchmark": "R$ 50"},
    "checkout_rate": {"value": ${avg3Days.checkoutRate.toFixed(2)}, "status": "${funnelStatus.checkoutRate}", "trend": "estável", "benchmark": "${benchmarks.checkoutRate}%"},
    "sale_rate": {"value": ${avg3Days.saleRate.toFixed(2)}, "status": "${funnelStatus.saleRate}", "trend": "estável", "benchmark": "${benchmarks.saleRate}%"}
  }
}

IMPORTANTE para actions:
- Para CADA ação, inclua: action, priority, metric, metric_label, metric_value, benchmark, reason
- metric_label: nome amigável da métrica (Hook Rate, Hold Rate, Close Rate, Connect Rate, CTR, CPM, Taxa Checkout, Taxa Conversão)
- metric_value: valor ATUAL com % ou R$
- benchmark: meta com % ou R$
- reason: 1 frase curta explicando o impacto (ex: "Apenas 15% das pessoas passam dos 3 segundos iniciais")
- Gere 3-5 ações cobrindo TODAS as etapas do funil com problemas, não só vídeo`;

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
