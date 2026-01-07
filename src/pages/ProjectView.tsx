import { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, RefreshCw, Settings, DollarSign, TrendingUp, ShoppingCart, MousePointerClick, Target } from 'lucide-react';

type DateRange = '7d' | '30d' | '90d' | 'all';

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d': return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case '30d': return new Date(now.setDate(now.getDate() - 30)).toISOString();
      case '90d': return new Date(now.setDate(now.getDate() - 90)).toISOString();
      default: return null;
    }
  };

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['sales', id, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select('*')
        .eq('project_id', id)
        .order('sale_date', { ascending: false });
      
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('sale_date', dateFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const { data: adSpend, isLoading: adSpendLoading } = useQuery({
    queryKey: ['ad_spend', id, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('ad_spend')
        .select('*')
        .eq('project_id', id)
        .order('date', { ascending: false });
      
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('date', dateFilter.split('T')[0]);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const syncData = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('sync-project-data', {
        body: { project_id: id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', id] });
      queryClient.invalidateQueries({ queryKey: ['ad_spend', id] });
      toast({ title: 'Dados atualizados!', description: 'Vendas e gastos foram sincronizados.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao sincronizar', description: error.message, variant: 'destructive' });
    },
  });

  // Calculate metrics
  const totalRevenue = sales?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
  const totalSpend = adSpend?.reduce((sum, a) => sum + Number(a.spend), 0) || 0;
  const totalClicks = adSpend?.reduce((sum, a) => sum + a.clicks, 0) || 0;
  const totalSales = sales?.length || 0;
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const conversionRate = totalClicks > 0 ? (totalSales / totalClicks) * 100 : 0;

  // Group sales by UTM
  const salesByUtm = sales?.reduce((acc, sale) => {
    const key = `${sale.utm_source || 'direto'}|${sale.utm_medium || '-'}|${sale.utm_campaign || '-'}`;
    if (!acc[key]) {
      acc[key] = { source: sale.utm_source || 'direto', medium: sale.utm_medium || '-', campaign: sale.utm_campaign || '-', count: 0, revenue: 0 };
    }
    acc[key].count++;
    acc[key].revenue += Number(sale.amount);
    return acc;
  }, {} as Record<string, { source: string; medium: string; campaign: string; count: number; revenue: number }>);

  const utmData = Object.values(salesByUtm || {}).sort((a, b) => b.revenue - a.revenue);

  if (loading || !user || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Projeto não encontrado</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => syncData.mutate()} disabled={syncData.isPending}>
              {syncData.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Atualizar</span>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link to={`/projects/${id}/edit`}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">{totalSales} vendas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gasto em Ads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{formatCurrency(totalSpend)}</div>
              <p className="text-xs text-muted-foreground">{totalClicks} cliques</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">ROAS</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${roas >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                {roas.toFixed(2)}x
              </div>
              <p className="text-xs text-muted-foreground">
                {roas >= 1 ? 'Lucro' : 'Prejuízo'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vendas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
              <p className="text-xs text-muted-foreground">
                Ticket médio: {totalSales > 0 ? formatCurrency(totalRevenue / totalSales) : '-'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversão</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">Cliques → Vendas</p>
            </CardContent>
          </Card>
        </div>

        {/* UTM Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Vendas por UTM</CardTitle>
            <CardDescription>Origem das vendas rastreadas por parâmetros UTM</CardDescription>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : utmData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Medium</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utmData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.source}</TableCell>
                      <TableCell>{row.medium}</TableCell>
                      <TableCell>{row.campaign}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma venda encontrada. Clique em "Atualizar" para sincronizar os dados.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Campaigns Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Campanha</CardTitle>
            <CardDescription>Gastos e métricas de cada campanha do Meta Ads</CardDescription>
          </CardHeader>
          <CardContent>
            {adSpendLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : adSpend && adSpend.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead className="text-right">Gasto</TableHead>
                    <TableHead className="text-right">Cliques</TableHead>
                    <TableHead className="text-right">Impressões</TableHead>
                    <TableHead className="text-right">CPM</TableHead>
                    <TableHead className="text-right">CPC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const grouped = adSpend.reduce((acc, row) => {
                      if (!acc[row.campaign_id]) {
                        acc[row.campaign_id] = { name: row.campaign_name, spend: 0, clicks: 0, impressions: 0 };
                      }
                      acc[row.campaign_id].spend += Number(row.spend);
                      acc[row.campaign_id].clicks += row.clicks;
                      acc[row.campaign_id].impressions += row.impressions;
                      return acc;
                    }, {} as Record<string, { name: string | null; spend: number; clicks: number; impressions: number }>);

                    return Object.entries(grouped).map(([id, data]) => (
                      <TableRow key={id}>
                        <TableCell className="font-medium">{data.name || id}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.spend)}</TableCell>
                        <TableCell className="text-right">{data.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{data.impressions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {data.impressions > 0 ? formatCurrency((data.spend / data.impressions) * 1000) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {data.clicks > 0 ? formatCurrency(data.spend / data.clicks) : '-'}
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum dado de campanha encontrado. Clique em "Atualizar" para sincronizar.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
