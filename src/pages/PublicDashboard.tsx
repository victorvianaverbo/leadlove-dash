import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, TrendingUp, ShoppingCart, Target, CheckCircle, Lock, BarChart3, ArrowUp, ArrowDown, Minus, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Type for the public project view (excludes user_id for privacy)
interface ProjectPublic {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  is_public: boolean | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
  kiwify_product_ids: string[] | null;
  meta_campaign_ids: string[] | null;
  benchmark_engagement: number | null;
  benchmark_ctr: number | null;
  benchmark_lp_rate: number | null;
  benchmark_checkout_rate: number | null;
  benchmark_sale_rate: number | null;
  campaign_objective: string | null;
  ad_type: string | null;
  account_status: string | null;
  investment_value: number | null;
  class_date: string | null;
  use_gross_for_roas: boolean | null;
}

// Type for the public sales view (excludes PII fields)
interface SalesPublic {
  id: string;
  project_id: string;
  user_id: string;
  external_sale_id: string;
  product_id: string;
  product_name: string | null;
  amount: number;
  gross_amount?: number | null;
  status: string;
  payment_method: string | null;
  sale_date: string;
  created_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

interface FunnelMetrics {
  impressions: number;
  linkClicks: number;
  lpViews: number;
  checkouts: number;
  sales: number;
  thruplays: number;
  revenue: number;
  spend: number;
  roas: number;
  cpa: number;
  rates: {
    engagement: number;
    ctr: number;
    lpRate: number;
    checkoutRate: number;
    saleRate: number;
  };
  benchmarks: {
    engagement: number;
    ctr: number;
    lpRate: number;
    checkoutRate: number;
    saleRate: number;
  };
  status: {
    engagement: 'ok' | 'alert';
    ctr: 'ok' | 'alert';
    lpRate: 'ok' | 'alert';
    checkoutRate: 'ok' | 'alert';
    saleRate: 'ok' | 'alert';
  };
}

// 3-day average metrics (for consistent display with recommendations)
interface Metrics3DayAvg {
  revenue: number;
  spend: number;
  roas: number;
  cpa: number;
  salesCount: number;
  hookRate?: number;
  holdRate?: number;
  closeRate?: number;
  connectRate?: number;
  ctrRate?: number;
  cpmValue?: number;
  checkoutRate?: number;
  saleRate?: number;
}

interface DailyReport {
  id: string;
  project_id: string;
  report_date: string;
  summary: string;
  comparison: {
    engagement?: { yesterday: number; dayBefore: number; change: number };
    ctr?: { yesterday: number; dayBefore: number; change: number };
    lpRate?: { yesterday: number; dayBefore: number; change: number };
    checkoutRate?: { yesterday: number; dayBefore: number; change: number };
    saleRate?: { yesterday: number; dayBefore: number; change: number };
    revenue: { yesterday: number; dayBefore: number; change: number };
    spend: { yesterday: number; dayBefore: number; change: number };
    sales: { yesterday: number; dayBefore: number; change: number };
    roas?: { yesterday: number; dayBefore: number; change: number };
    cpa?: { yesterday: number; dayBefore: number; change: number };
  };
  actions: Array<{ 
    action: string; 
    priority: string; 
    metric?: string;
    metric_label?: string;
    metric_value?: string;
    benchmark?: string;
    reason?: string;
  }>;
  metrics: FunnelMetrics;
  // 3-day average metrics for consistent display
  metrics_avg3days?: Metrics3DayAvg;
  created_at: string;
}

function ChangeIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center text-success text-xs font-medium">
        <ArrowUp className="h-3 w-3 mr-0.5" />
        +{value.toFixed(1)}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center text-destructive text-xs font-medium">
        <ArrowDown className="h-3 w-3 mr-0.5" />
        {value.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-muted-foreground text-xs font-medium">
      <Minus className="h-3 w-3 mr-0.5" />
      0%
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    alta: 'bg-destructive/10 text-destructive border-destructive/20',
    média: 'bg-warning/10 text-warning border-warning/20',
    media: 'bg-warning/10 text-warning border-warning/20',
    baixa: 'bg-muted text-muted-foreground border-muted',
  };
  
  return (
    <Badge variant="outline" className={colors[priority.toLowerCase()] || colors.baixa}>
      {priority}
    </Badge>
  );
}

// Helper to get date in Brasilia timezone (UTC-3)
function getBrasiliaDate(daysAgo = 0): string {
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const utcOffset = now.getTimezoneOffset();
  const totalOffset = brasiliaOffset + utcOffset;
  
  const brasilia = new Date(now.getTime() + totalOffset * 60 * 1000);
  brasilia.setDate(brasilia.getDate() - daysAgo);
  
  return brasilia.toISOString().split('T')[0];
}

// Converte meia-noite de Brasília para UTC (+3 horas)
// Mesma lógica usada no ProjectView.tsx para consistência
function brasiliaToUTC(dateStr: string): string {
  // dateStr vem como "YYYY-MM-DD"
  // Meia-noite Brasília (00:00 BRT) = 03:00 UTC
  return `${dateStr}T03:00:00.000Z`;
}

// Próximo dia em UTC (usado para filtro < end date)
function getNextDayUTC(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return `${date.toISOString().split('T')[0]}T03:00:00.000Z`;
}

export default function PublicDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const today = getBrasiliaDate(0);
  const yesterday = getBrasiliaDate(1);

  // Fetch project by slug (no auth required)
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ['public-project', slug],
    queryFn: async (): Promise<ProjectPublic> => {
      const { data, error } = await supabase
        .from('projects_public' as any)
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data as unknown as ProjectPublic;
    },
    enabled: !!slug,
  });

  // Fetch latest daily report (yesterday's report)
  const { data: latestReport } = useQuery({
    queryKey: ['public-daily-report', project?.id],
    queryFn: async (): Promise<DailyReport | null> => {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('project_id', project!.id)
        .order('report_date', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as unknown as DailyReport;
    },
    enabled: !!project?.id,
  });

  // Fetch TODAY's sales (real-time) - Usando conversão Brasília → UTC
  const { data: todaySales } = useQuery({
    queryKey: ['public-sales-today', project?.id, today],
    queryFn: async (): Promise<SalesPublic[]> => {
      const todayStart = brasiliaToUTC(today);
      const todayEnd = getNextDayUTC(today);
      
      const { data, error } = await supabase
        .from('sales_public' as any)
        .select('*')
        .eq('project_id', project!.id)
        .eq('status', 'paid')
        .gte('sale_date', todayStart)
        .lt('sale_date', todayEnd);
      
      if (error) throw error;
      return (data || []) as unknown as SalesPublic[];
    },
    enabled: !!project?.id,
  });

  // Fetch TODAY's ad spend (real-time)
  const { data: todayAdSpend } = useQuery({
    queryKey: ['public-ad-spend-today', project?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_spend')
        .select('*')
        .eq('project_id', project!.id)
        .eq('date', today);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!project?.id,
  });

  // Fetch ALL sales (total period)
  const { data: allSales } = useQuery({
    queryKey: ['public-sales-total', project?.id],
    queryFn: async (): Promise<SalesPublic[]> => {
      const { data, error } = await supabase
        .from('sales_public' as any)
        .select('*')
        .eq('project_id', project!.id)
        .eq('status', 'paid');
      
      if (error) throw error;
      return (data || []) as unknown as SalesPublic[];
    },
    enabled: !!project?.id,
  });

  // Fetch ALL ad spend (total period)
  const { data: allAdSpend } = useQuery({
    queryKey: ['public-ad-spend-total', project?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_spend')
        .select('*')
        .eq('project_id', project!.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!project?.id,
  });

  // Filter data by project settings
  const filterSales = (sales: SalesPublic[] | undefined) => 
    sales?.filter(s => 
      !project?.kiwify_product_ids?.length || project.kiwify_product_ids.includes(s.product_id)
    ) || [];

  const filterAdSpend = (adSpend: any[] | undefined) =>
    adSpend?.filter(a =>
      !project?.meta_campaign_ids?.length || project.meta_campaign_ids.includes(a.campaign_id)
    ) || [];

  // Check if project uses gross amount for ROAS calculation
  const useGrossForRoas = project?.use_gross_for_roas || false;

  // When ticket price is configured, use it for revenue calculation (quantity × ticket price)
  const ticketPrice = (project as any)?.kiwify_ticket_price 
    ? parseFloat((project as any).kiwify_ticket_price) 
    : null;

  // Helper to get the correct amount based on project settings
  const getSaleValue = (sale: SalesPublic) => {
    // Priority 1: If ticket price is configured, use it for each sale
    if (ticketPrice) return ticketPrice;
    // Priority 2: Use gross_amount if useGrossForRoas, otherwise use amount
    return useGrossForRoas ? (sale.gross_amount || sale.amount) : sale.amount;
  };

  // Today's metrics
  const filteredTodaySales = filterSales(todaySales);
  const filteredTodayAdSpend = filterAdSpend(todayAdSpend);
  const todayRevenue = filteredTodaySales.reduce((sum, s) => sum + Number(getSaleValue(s)), 0);
  const todaySpend = filteredTodayAdSpend.reduce((sum, a) => sum + Number(a.spend), 0);
  const todaySalesCount = filteredTodaySales.length;
  const todayRoas = todaySpend > 0 ? todayRevenue / todaySpend : 0;
  const todayCpa = todaySalesCount > 0 ? todaySpend / todaySalesCount : 0;

  // Total period metrics
  const filteredAllSales = filterSales(allSales);
  const filteredAllAdSpend = filterAdSpend(allAdSpend);
  const totalRevenue = filteredAllSales.reduce((sum, s) => sum + Number(getSaleValue(s)), 0);
  const totalSpend = filteredAllAdSpend.reduce((sum, a) => sum + Number(a.spend), 0);
  const totalSalesCount = filteredAllSales.length;
  const totalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const totalCpa = totalSalesCount > 0 ? totalSpend / totalSalesCount : 0;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatReportDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const handleUpdateReport = async () => {
    if (!project?.id) return;
    
    setIsUpdating(true);
    try {
      // Step 1: Sync data from Kiwify + Meta Ads
      const { error: syncError, data: syncData } = await supabase.functions.invoke('sync-public-project', {
        body: { project_id: project.id }
      });

      if (syncError) throw syncError;
      if (syncData?.error) throw new Error(syncData.error);

      console.log(`Synced ${syncData?.salesSynced || 0} sales, ${syncData?.adSpendSynced || 0} ad records`);

      // Step 2: Generate updated AI report
      const { error: reportError } = await supabase.functions.invoke('generate-daily-report', {
        body: { project_id: project.id }
      });

      if (reportError) throw reportError;

      // Invalidate queries to refetch data
      await queryClient.invalidateQueries({ queryKey: ['public-daily-report', project.id] });
      await queryClient.invalidateQueries({ queryKey: ['public-sales-today', project.id] });
      await queryClient.invalidateQueries({ queryKey: ['public-ad-spend-today', project.id] });
      await queryClient.invalidateQueries({ queryKey: ['public-sales-total', project.id] });
      await queryClient.invalidateQueries({ queryKey: ['public-ad-spend-total', project.id] });

      toast.success('Dados sincronizados e relatório atualizado!');
    } catch (err) {
      console.error('Error updating report:', err);
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if report has funnel metrics (new format)
  const hasFunnelMetrics = latestReport?.metrics?.rates !== undefined;

  if (projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Dashboard não encontrado</h1>
        <p className="text-muted-foreground">Este link pode estar desativado ou não existe.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary rounded-xl">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
          <Button 
            onClick={handleUpdateReport} 
            disabled={isUpdating}
            variant="outline"
            className="gap-2"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Section 1: Today's Summary (Real-time) */}
        <Card className="border border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Resumo de Hoje</CardTitle>
              </div>
              <Badge variant="outline" className="border-primary text-primary">
                Tempo Real
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Receita</p>
                <p className="font-semibold text-success">{formatCurrency(todayRevenue)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Gasto</p>
                <p className="font-semibold text-destructive">{formatCurrency(todaySpend)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">ROAS</p>
                <p className={`font-semibold ${todayRoas >= 1 ? 'text-success' : 'text-destructive'}`}>
                  {todayRoas.toFixed(2)}x
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">CPA</p>
                <p className="font-semibold">{formatCurrency(todayCpa)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Vendas</p>
                <p className="font-semibold">{todaySalesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: 3-Day Analysis (AI Generated) */}
        {latestReport && (
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-muted rounded-lg">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">Análise dos Últimos 3 Dias</CardTitle>
                </div>
                <span className="text-sm text-muted-foreground capitalize">
                  Atualizado em {formatReportDate(latestReport.report_date)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <p className="text-sm leading-relaxed">{latestReport.summary}</p>

              {/* Metrics - Use 3-day averages with fallback to D1 for older reports */}
              {(() => {
                const displayMetrics = latestReport.metrics_avg3days || latestReport.metrics;
                const revenue = displayMetrics?.revenue || 0;
                const spend = displayMetrics?.spend || 0;
                const roas = displayMetrics?.roas || 0;
                const cpa = displayMetrics?.cpa || 0;
                const salesCount = 'salesCount' in displayMetrics 
                  ? (displayMetrics as Metrics3DayAvg).salesCount 
                  : (displayMetrics as FunnelMetrics)?.sales || 0;
                
                return (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-card rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-1">Receita (média)</p>
                      <p className="font-semibold text-success">
                        {formatCurrency(revenue)}
                      </p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-1">Gasto (média)</p>
                      <p className="font-semibold text-destructive">
                        {formatCurrency(spend)}
                      </p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-1">ROAS</p>
                      <p className={`font-semibold ${roas >= 1 ? 'text-success' : 'text-destructive'}`}>
                        {roas.toFixed(2)}x
                      </p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-1">CPA</p>
                      <p className="font-semibold">{formatCurrency(cpa)}</p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-1">Vendas (média)</p>
                      <p className="font-semibold">{salesCount.toFixed(1)}</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Section 3: Total Period */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-muted rounded-lg">
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Acumulado do Período</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Total Faturado</p>
                <p className="font-semibold text-success">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Total Gasto</p>
                <p className="font-semibold text-destructive">{formatCurrency(totalSpend)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">ROAS Geral</p>
                <p className={`font-semibold ${totalRoas >= 1 ? 'text-success' : 'text-destructive'}`}>
                  {totalRoas.toFixed(2)}x
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">CPA Médio</p>
                <p className="font-semibold">{formatCurrency(totalCpa)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Total Vendas</p>
                <p className="font-semibold">{totalSalesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Recommended Actions */}
        {latestReport?.actions && latestReport.actions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Ações Recomendadas</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Baseado na análise dos últimos 3 dias
              </p>
            </CardHeader>
            <CardContent>
            <div className="space-y-3">
                {latestReport.actions.map((item, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-4 border space-y-2">
                    {/* Linha 1: Métrica + Prioridade */}
                    <div className="flex items-center justify-between gap-2">
                      {item.metric_label && item.metric_value ? (
                        <Badge variant="secondary" className="text-xs font-medium">
                          {item.metric_label}: {item.metric_value} {item.benchmark && `(meta: ${item.benchmark})`}
                        </Badge>
                      ) : (
                        <div />
                      )}
                      <PriorityBadge priority={item.priority} />
                    </div>
                    {/* Linha 2: Ação */}
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium flex-1">{item.action}</span>
                    </div>
                    {/* Linha 3: Motivo (opcional) */}
                    {item.reason && (
                      <p className="text-xs text-muted-foreground pl-6">{item.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Powered by badge */}
        <div className="text-center pt-4">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 bg-card rounded-full border">
            Powered by
            <span className="font-semibold text-primary">MetrikaPRO</span>
          </span>
        </div>
      </main>
    </div>
  );
}
