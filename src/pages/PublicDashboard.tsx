import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, DollarSign, TrendingUp, ShoppingCart, Target, Eye, Users, Repeat, BarChart3, MousePointer, FileText, Percent, Wallet, Play, Video, CheckCircle, Lock } from 'lucide-react';

type DateRange = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all';

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

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['public-sales', project?.id, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select('*')
        .eq('project_id', project!.id)
        .order('sale_date', { ascending: false });
      
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('sale_date', dateFilter);
      }
      const endDateFilter = getEndDateFilter();
      if (endDateFilter) {
        query = query.lt('sale_date', endDateFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!project?.id,
  });

  const { data: adSpend, isLoading: adSpendLoading } = useQuery({
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
  const totalClicks = filteredAdSpend?.reduce((sum, a) => sum + a.clicks, 0) || 0;
  const totalSales = filteredSales?.length || 0;
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Funnel metrics
  const totalImpressions = filteredAdSpend?.reduce((sum, a) => sum + a.impressions, 0) || 0;
  const totalReach = filteredAdSpend?.reduce((sum, a) => sum + (a.reach || 0), 0) || 0;
  const totalLandingPageViews = filteredAdSpend?.reduce((sum, a) => sum + (a.landing_page_views || 0), 0) || 0;
  const totalLinkClicks = filteredAdSpend?.reduce((sum, a) => sum + (a.link_clicks || 0), 0) || 0;
  const dailyBudget = filteredAdSpend?.[0]?.daily_budget || 0;
  const totalCheckoutsInitiated = filteredAdSpend?.reduce((sum, a) => sum + (a.checkouts_initiated || 0), 0) || 0;
  const totalThruplays = filteredAdSpend?.reduce((sum, a) => sum + (a.thruplays || 0), 0) || 0;
  const totalVideo3sViews = filteredAdSpend?.reduce((sum, a) => sum + (a.video_3s_views || 0), 0) || 0;

  // Calculated metrics
  const avgFrequency = totalReach > 0 ? totalImpressions / totalReach : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const ctr = totalImpressions > 0 ? (totalLinkClicks / totalImpressions) * 100 : 0;
  const lpViewRate = totalLinkClicks > 0 ? (totalLandingPageViews / totalLinkClicks) * 100 : 0;
  const custoPerVenda = totalSales > 0 ? totalSpend / totalSales : 0;
  const vendaPerLP = totalLandingPageViews > 0 ? (totalSales / totalLandingPageViews) * 100 : 0;
  const checkoutConversionRate = totalCheckoutsInitiated > 0 ? (totalSales / totalCheckoutsInitiated) * 100 : 0;
  const creativeEngagementRate = totalVideo3sViews > 0 ? (totalThruplays / totalVideo3sViews) * 100 : 0;
  const custoPerCheckout = totalCheckoutsInitiated > 0 ? totalSpend / totalCheckoutsInitiated : 0;

  // Group sales by UTM
  const salesByUtm = filteredSales?.reduce((acc, sale) => {
    const key = `${sale.utm_source || 'direto'}|${sale.utm_medium || '-'}|${sale.utm_campaign || '-'}`;
    if (!acc[key]) {
      acc[key] = { source: sale.utm_source || 'direto', medium: sale.utm_medium || '-', campaign: sale.utm_campaign || '-', count: 0, revenue: 0 };
    }
    acc[key].count++;
    acc[key].revenue += Number(sale.amount);
    return acc;
  }, {} as Record<string, { source: string; medium: string; campaign: string; count: number; revenue: number }>);

  const utmData = Object.values(salesByUtm || {}).sort((a, b) => b.revenue - a.revenue);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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
        <Lock className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Dashboard não encontrado</h1>
        <p className="text-muted-foreground">Este link pode estar desativado ou não existe.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
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
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Orçamento/Dia</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dailyBudget)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">{totalSales} vendas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSpend)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">ROAS</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                {roas.toFixed(2)}x
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">CPA</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(custoPerVenda)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Metrics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Funil de Marketing</CardTitle>
            <CardDescription>Métricas de performance por etapa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Awareness */}
              <div>
                <h4 className="font-semibold mb-2 text-muted-foreground">Awareness</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Eye className="h-4 w-4" />
                      Impressões
                    </div>
                    <div className="text-lg font-bold">{totalImpressions.toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Users className="h-4 w-4" />
                      Alcance
                    </div>
                    <div className="text-lg font-bold">{totalReach.toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Repeat className="h-4 w-4" />
                      Frequência
                    </div>
                    <div className="text-lg font-bold">{avgFrequency.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <BarChart3 className="h-4 w-4" />
                      CPM
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(avgCPM)}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Video className="h-4 w-4" />
                      Video 3s Views
                    </div>
                    <div className="text-lg font-bold">{totalVideo3sViews.toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              </div>

              {/* Consideration */}
              <div>
                <h4 className="font-semibold mb-2 text-muted-foreground">Consideração</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MousePointer className="h-4 w-4" />
                      Cliques no Link
                    </div>
                    <div className="text-lg font-bold">{totalLinkClicks.toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Percent className="h-4 w-4" />
                      CTR
                    </div>
                    <div className="text-lg font-bold">{ctr.toFixed(2)}%</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <FileText className="h-4 w-4" />
                      Views na LP
                    </div>
                    <div className="text-lg font-bold">{totalLandingPageViews.toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Percent className="h-4 w-4" />
                      LP View Rate
                    </div>
                    <div className="text-lg font-bold">{lpViewRate.toFixed(1)}%</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Play className="h-4 w-4" />
                      Thruplays
                    </div>
                    <div className="text-lg font-bold">{totalThruplays.toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              </div>

              {/* Conversion */}
              <div>
                <h4 className="font-semibold mb-2 text-muted-foreground">Conversão</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <ShoppingCart className="h-4 w-4" />
                      Checkouts
                    </div>
                    <div className="text-lg font-bold">{totalCheckoutsInitiated.toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      Custo/Checkout
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(custoPerCheckout)}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <CheckCircle className="h-4 w-4" />
                      Vendas
                    </div>
                    <div className="text-lg font-bold">{totalSales}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Percent className="h-4 w-4" />
                      Checkout Conv.
                    </div>
                    <div className="text-lg font-bold">{checkoutConversionRate.toFixed(1)}%</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Target className="h-4 w-4" />
                      CPA
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(custoPerVenda)}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UTM Table */}
        {utmData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Vendas por Fonte</CardTitle>
              <CardDescription>Origem das vendas por UTM</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Mídia</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utmData.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.source}</TableCell>
                      <TableCell>{row.medium}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{row.campaign}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4 border-t">
          Dashboard compartilhado • Última sincronização: {project.last_sync_at ? new Date(project.last_sync_at).toLocaleString('pt-BR') : 'Nunca'}
        </div>
      </main>
    </div>
  );
}
