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

  // Fetch project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const projectData = project as any;

  // Fetch yesterday's sales (the report is generated at midnight, so we report on yesterday)
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

  // Calculate metrics for yesterday
  const yesterdayRevenue = filteredYesterdaySales.reduce((sum, s) => sum + Number(s.amount), 0);
  const yesterdaySpend = filteredYesterdayAdSpend.reduce((sum, a) => sum + Number(a.spend), 0);
  const yesterdaySalesCount = filteredYesterdaySales.length;
  const yesterdayRoas = yesterdaySpend > 0 ? yesterdayRevenue / yesterdaySpend : 0;
  const yesterdayCpa = yesterdaySalesCount > 0 ? yesterdaySpend / yesterdaySalesCount : 0;
  const yesterdayImpressions = filteredYesterdayAdSpend.reduce((sum, a) => sum + Number(a.impressions || 0), 0);
  const yesterdayClicks = filteredYesterdayAdSpend.reduce((sum, a) => sum + Number(a.clicks || 0), 0);
  const yesterdayCtr = yesterdayImpressions > 0 ? (yesterdayClicks / yesterdayImpressions) * 100 : 0;
  const yesterdayCpm = yesterdayImpressions > 0 ? (yesterdaySpend / yesterdayImpressions) * 1000 : 0;
  const yesterdayCpc = yesterdayClicks > 0 ? yesterdaySpend / yesterdayClicks : 0;

  // Calculate metrics for day before
  const dayBeforeRevenue = filteredDayBeforeSales.reduce((sum, s) => sum + Number(s.amount), 0);
  const dayBeforeSpend = filteredDayBeforeAdSpend.reduce((sum, a) => sum + Number(a.spend), 0);
  const dayBeforeSalesCount = filteredDayBeforeSales.length;
  const dayBeforeRoas = dayBeforeSpend > 0 ? dayBeforeRevenue / dayBeforeSpend : 0;
  const dayBeforeCpa = dayBeforeSalesCount > 0 ? dayBeforeSpend / dayBeforeSalesCount : 0;

  // Build comparison data
  const comparison = {
    revenue: {
      yesterday: yesterdayRevenue,
      dayBefore: dayBeforeRevenue,
      change: dayBeforeRevenue > 0 ? ((yesterdayRevenue - dayBeforeRevenue) / dayBeforeRevenue) * 100 : 0,
    },
    spend: {
      yesterday: yesterdaySpend,
      dayBefore: dayBeforeSpend,
      change: dayBeforeSpend > 0 ? ((yesterdaySpend - dayBeforeSpend) / dayBeforeSpend) * 100 : 0,
    },
    sales: {
      yesterday: yesterdaySalesCount,
      dayBefore: dayBeforeSalesCount,
      change: dayBeforeSalesCount > 0 ? ((yesterdaySalesCount - dayBeforeSalesCount) / dayBeforeSalesCount) * 100 : 0,
    },
    roas: {
      yesterday: yesterdayRoas,
      dayBefore: dayBeforeRoas,
      change: dayBeforeRoas > 0 ? ((yesterdayRoas - dayBeforeRoas) / dayBeforeRoas) * 100 : 0,
    },
    cpa: {
      yesterday: yesterdayCpa,
      dayBefore: dayBeforeCpa,
      change: dayBeforeCpa > 0 ? ((yesterdayCpa - dayBeforeCpa) / dayBeforeCpa) * 100 : 0,
    },
  };

  const metrics = {
    revenue: yesterdayRevenue,
    spend: yesterdaySpend,
    sales: yesterdaySalesCount,
    roas: yesterdayRoas,
    cpa: yesterdayCpa,
    impressions: yesterdayImpressions,
    clicks: yesterdayClicks,
    ctr: yesterdayCtr,
    cpm: yesterdayCpm,
    cpc: yesterdayCpc,
  };

  // Generate AI summary
  const prompt = `Você é um analista de performance de marketing digital. Analise os dados abaixo e gere um relatório executivo em português brasileiro.

DADOS DO DIA ${yesterday}:
- Receita: R$ ${yesterdayRevenue.toFixed(2)} (${yesterdaySalesCount} vendas)
- Gasto em Ads: R$ ${yesterdaySpend.toFixed(2)}
- ROAS: ${yesterdayRoas.toFixed(2)}x
- CPA: R$ ${yesterdayCpa.toFixed(2)}
- CTR: ${yesterdayCtr.toFixed(2)}%
- CPM: R$ ${yesterdayCpm.toFixed(2)}
- CPC: R$ ${yesterdayCpc.toFixed(2)}
- Impressões: ${yesterdayImpressions.toLocaleString()}
- Cliques: ${yesterdayClicks.toLocaleString()}

COMPARAÇÃO COM O DIA ANTERIOR (${dayBeforeYesterday}):
- Receita: R$ ${dayBeforeRevenue.toFixed(2)} (${dayBeforeSalesCount} vendas) → ${comparison.revenue.change > 0 ? '+' : ''}${comparison.revenue.change.toFixed(1)}%
- Gasto: R$ ${dayBeforeSpend.toFixed(2)} → ${comparison.spend.change > 0 ? '+' : ''}${comparison.spend.change.toFixed(1)}%
- ROAS: ${dayBeforeRoas.toFixed(2)}x → ${comparison.roas.change > 0 ? '+' : ''}${comparison.roas.change.toFixed(1)}%
- CPA: R$ ${dayBeforeCpa.toFixed(2)} → ${comparison.cpa.change > 0 ? '+' : ''}${comparison.cpa.change.toFixed(1)}%

Gere um relatório com:
1. Um resumo executivo de 2-3 frases sobre o desempenho do dia
2. Destaques positivos e negativos
3. 3-5 ações recomendadas para o próximo dia, baseadas nos dados

Formato de resposta (JSON):
{
  "summary": "Resumo executivo aqui...",
  "highlights": {
    "positive": ["ponto positivo 1", "ponto positivo 2"],
    "negative": ["ponto negativo 1"]
  },
  "actions": [
    {"action": "Ação 1", "priority": "alta"},
    {"action": "Ação 2", "priority": "média"}
  ]
}`;

  console.log('Calling Lovable AI for report generation...');

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'Você é um analista de marketing digital especializado. Responda sempre em JSON válido.' },
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
      highlights: { positive: [], negative: [] },
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
      comparison,
      actions: parsedAiResponse.actions || [],
      metrics,
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
  };
}
