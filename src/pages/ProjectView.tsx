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
import { Loader2, ArrowLeft, RefreshCw, Settings, DollarSign, TrendingUp, ShoppingCart, Target } from 'lucide-react';

type DateRange = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all';

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
      const endDateFilter = getEndDateFilter();
      if (endDateFilter) {
        query = query.lt('sale_date', endDateFilter);
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
      const endDateFilter = getEndDateFilter();
      if (endDateFilter) {
        query = query.lt('date', endDateFilter.split('T')[0]);
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
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: 'Dados atualizados!', description: 'Vendas e gastos foram sincronizados.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao sincronizar', description: error.message, variant: 'destructive' });
    },
  });

  // Filter sales by selected products (from project settings)
  const filteredSales = sales?.filter(s => 
    !project?.kiwify_product_ids?.length || project.kiwify_product_ids.includes(s.product_id)
  );

  // Filter ad spend by selected campaigns (from project settings)
  const filteredAdSpend = adSpend?.filter(a =>
    !project?.meta_campaign_ids?.length || project.meta_campaign_ids.includes(a.campaign_id)
  );

  // Calculate metrics using filtered data
  const totalRevenue = filteredSales?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
  const totalSpend = filteredAdSpend?.reduce((sum, a) => sum + Number(a.spend), 0) || 0;
  const totalClicks = filteredAdSpend?.reduce((sum, a) => sum + a.clicks, 0) || 0;
  const totalSales = filteredSales?.length || 0;
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {totalSales} vendas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gasto em Ads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{formatCurrency(totalSpend)}</div>
              <p className="text-xs text-muted-foreground">
                {totalClicks} cliques
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">ROAS</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roas.toFixed(2)}x</div>
              <p className="text-xs text-muted-foreground">
                Retorno sobre gasto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">CPA</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalSales > 0 ? formatCurrency(totalSpend / totalSales) : 'R$ 0,00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Custo por aquisição
              </p>
            </CardContent>
          </Card>
        </div>

        {/* UTM Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Vendas por UTM</CardTitle>
            <CardDescription>Análise de performance por fonte de tráfego</CardDescription>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : utmData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Mídia</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utmData.map((row, idx) => (
                    <TableRow key={idx}>
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
                Nenhuma venda encontrada no período selecionado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ad Spend by Campaign */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Campanha</CardTitle>
            <CardDescription>Distribuição de gastos em anúncios</CardDescription>
          </CardHeader>
          <CardContent>
            {adSpendLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredAdSpend && filteredAdSpend.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Gasto</TableHead>
                    <TableHead className="text-right">Impressões</TableHead>
                    <TableHead className="text-right">Cliques</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdSpend.slice(0, 20).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.campaign_name || row.campaign_id}</TableCell>
                      <TableCell>{new Date(row.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.spend)}</TableCell>
                      <TableCell className="text-right">{row.impressions.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-right">{row.clicks.toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum gasto em ads encontrado no período selecionado
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}