import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, DollarSign, TrendingUp, ShoppingCart, Target, CheckCircle, Lock } from 'lucide-react';

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

  const { data: sales } = useQuery({
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
        {/* Summary Cards - 5 Essential Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
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
              <div className="text-2xl font-bold">{formatCurrency(cpa)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vendas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
