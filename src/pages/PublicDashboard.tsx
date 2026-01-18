import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, DollarSign, TrendingUp, ShoppingCart, Target, CheckCircle, Lock, BarChart3, ArrowUp, ArrowDown, Minus, Sparkles, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type DateRange = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all';

// Type for the public sales view (excludes PII fields)
interface SalesPublic {
  id: string;
  project_id: string;
  user_id: string;
  kiwify_sale_id: string;
  product_id: string;
  product_name: string | null;
  amount: number;
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

interface DailyReport {
  id: string;
  project_id: string;
  report_date: string;
  summary: string;
  comparison: {
    revenue: { yesterday: number; dayBefore: number; change: number };
    spend: { yesterday: number; dayBefore: number; change: number };
    sales: { yesterday: number; dayBefore: number; change: number };
    roas: { yesterday: number; dayBefore: number; change: number };
    cpa: { yesterday: number; dayBefore: number; change: number };
  };
  actions: Array<{ action: string; priority: string }>;
  metrics: {
    revenue: number;
    spend: number;
    sales: number;
    roas: number;
    cpa: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpm: number;
    cpc: number;
  };
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

export default function PublicDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // Fetch project by slug (no auth required)
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ['public-project', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .eq('is_public', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch latest daily report
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

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.toISOString();
      }
      case 'yesterday': {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        return yesterday.toISOString();
      }
      case '7d': return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case '30d': return new Date(now.setDate(now.getDate() - 30)).toISOString();
      case '90d': return new Date(now.setDate(now.getDate() - 90)).toISOString();
      case 'all': {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return sixMonthsAgo.toISOString();
      }
      default: return null;
    }
  };

  const getEndDateFilter = () => {
    if (dateRange === 'yesterday') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.toISOString();
    }
    return null;
  };

  // Use sales_public view to avoid exposing PII (customer_email, customer_name)
  const { data: sales } = useQuery({
    queryKey: ['public-sales', project?.id, dateRange],
    queryFn: async (): Promise<SalesPublic[]> => {
      const dateFilter = getDateFilter();
      const endDateFilter = getEndDateFilter();
      
      let query = supabase
        .from('sales_public' as any)
        .select('*')
        .eq('project_id', project!.id)
        .order('sale_date', { ascending: false });
      
      if (dateFilter) {
        query = query.gte('sale_date', dateFilter);
      }
      if (endDateFilter) {
        query = query.lt('sale_date', endDateFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as SalesPublic[];
    },
    enabled: !!project?.id,
  });

  const { data: adSpend } = useQuery({
    queryKey: ['public-ad_spend', project?.id, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('ad_spend')
        .select('*')
        .eq('project_id', project!.id)
        .order('date', { ascending: false });
      
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('date', dateFilter.split('T')[0]);
      }
      const endDateFilter = getEndDateFilter();
      if (endDateFilter) {
        query = query.lt('date', endDateFilter.split('T')[0]);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!project?.id,
  });

  // Filter data by project settings
  const filteredSales = sales?.filter(s => 
    !project?.kiwify_product_ids?.length || project.kiwify_product_ids.includes(s.product_id)
  );

  const filteredAdSpend = adSpend?.filter(a =>
    !project?.meta_campaign_ids?.length || project.meta_campaign_ids.includes(a.campaign_id)
  );

  // Calculate metrics
  const totalRevenue = filteredSales?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
  const totalSpend = filteredAdSpend?.reduce((sum, a) => sum + Number(a.spend), 0) || 0;
  const totalSales = filteredSales?.length || 0;
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const cpa = totalSales > 0 ? totalSpend / totalSales : 0;

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
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-primary rounded-xl shadow-primary">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* AI Daily Report Section */}
        {latestReport && (
          <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Relatório do Dia</CardTitle>
                </div>
                <span className="text-sm text-muted-foreground capitalize">
                  {formatReportDate(latestReport.report_date)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <p className="text-sm leading-relaxed">{latestReport.summary}</p>

              {/* Metrics comparison */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">Receita</p>
                  <p className="font-semibold text-success">{formatCurrency(latestReport.metrics.revenue)}</p>
                  <ChangeIndicator value={latestReport.comparison.revenue.change} />
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">Gasto</p>
                  <p className="font-semibold text-destructive">{formatCurrency(latestReport.metrics.spend)}</p>
                  <ChangeIndicator value={-latestReport.comparison.spend.change} />
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">ROAS</p>
                  <p className={`font-semibold ${latestReport.metrics.roas >= 1 ? 'text-success' : 'text-destructive'}`}>
                    {latestReport.metrics.roas.toFixed(2)}x
                  </p>
                  <ChangeIndicator value={latestReport.comparison.roas.change} />
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">CPA</p>
                  <p className="font-semibold">{formatCurrency(latestReport.metrics.cpa)}</p>
                  <ChangeIndicator value={-latestReport.comparison.cpa.change} />
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">Vendas</p>
                  <p className="font-semibold">{latestReport.metrics.sales}</p>
                  <ChangeIndicator value={latestReport.comparison.sales.change} />
                </div>
              </div>

              {/* Actions */}
              {latestReport.actions && latestReport.actions.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Ações Recomendadas
                  </p>
                  <div className="space-y-2">
                    {latestReport.actions.map((item, index) => (
                      <div key={index} className="flex items-start gap-2 bg-card rounded-lg p-3 border">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm flex-1">{item.action}</span>
                        <PriorityBadge priority={item.priority} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Cards - 5 Essential Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">{totalSales} vendas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
              <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totalSpend)}</div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${roas >= 1 ? 'border-l-success' : 'border-l-destructive'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">ROAS</CardTitle>
              <div className={`w-8 h-8 ${roas >= 1 ? 'bg-success/10' : 'bg-destructive/10'} rounded-lg flex items-center justify-center`}>
                <TrendingUp className={`h-4 w-4 ${roas >= 1 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${roas >= 1 ? 'text-success' : 'text-destructive'}`}>
                {roas.toFixed(2)}x
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-info">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">CPA</CardTitle>
              <div className="w-8 h-8 bg-info/10 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{formatCurrency(cpa)}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vendas</CardTitle>
              <div className="w-8 h-8 bg-primary-soft rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
            </CardContent>
          </Card>
        </div>

        {/* Powered by badge */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 bg-card rounded-full border">
            Powered by
            <span className="font-semibold text-primary">MetrikaPRO</span>
          </span>
        </div>
      </main>
    </div>
  );
}
