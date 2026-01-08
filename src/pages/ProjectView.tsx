import { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, RefreshCw, Settings, DollarSign, TrendingUp, ShoppingCart, Target, Filter } from 'lucide-react';

type DateRange = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all';

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

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

  // Load saved filters from project
  useEffect(() => {
    if (project) {
      setSelectedProducts(project.kiwify_product_ids || []);
      setSelectedCampaigns(project.meta_campaign_ids || []);
    }
  }, [project]);

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

  // Fetch available products
  const { data: availableProducts } = useQuery({
    queryKey: ['available-products', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('product_id, product_name')
        .eq('project_id', id);
      if (error) throw error;
      
      const unique = new Map<string, string>();
      data?.forEach(s => {
        if (!unique.has(s.product_id)) {
          unique.set(s.product_id, s.product_name || s.product_id);
        }
      });
      return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    },
    enabled: !!user && !!id,
  });

  // Fetch available campaigns
  const { data: availableCampaigns } = useQuery({
    queryKey: ['available-campaigns', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_spend')
        .select('campaign_id, campaign_name')
        .eq('project_id', id);
      if (error) throw error;
      
      const unique = new Map<string, string>();
      data?.forEach(a => {
        if (!unique.has(a.campaign_id)) {
          unique.set(a.campaign_id, a.campaign_name || a.campaign_id);
        }
      });
      return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
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
      queryClient.invalidateQueries({ queryKey: ['available-products', id] });
      queryClient.invalidateQueries({ queryKey: ['available-campaigns', id] });
      toast({ title: 'Dados atualizados!', description: 'Vendas e gastos foram sincronizados.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao sincronizar', description: error.message, variant: 'destructive' });
    },
  });

  const saveProductFilters = useMutation({
    mutationFn: async (products: string[]) => {
      const { error } = await supabase
        .from('projects')
        .update({ kiwify_product_ids: products })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Filtros de produtos salvos!' });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar filtros', description: error.message, variant: 'destructive' });
    },
  });

  const saveCampaignFilters = useMutation({
    mutationFn: async (campaigns: string[]) => {
      const { error } = await supabase
        .from('projects')
        .update({ meta_campaign_ids: campaigns })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Filtros de campanhas salvos!' });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar filtros', description: error.message, variant: 'destructive' });
    },
  });

  // Filter sales by selected products
  const filteredSales = sales?.filter(s => 
    selectedProducts.length === 0 || selectedProducts.includes(s.product_id)
  );

  // Filter ad spend by selected campaigns
  const filteredAdSpend = adSpend?.filter(a =>
    selectedCampaigns.length === 0 || selectedCampaigns.includes(a.campaign_id)
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

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(p => p !== productId)
        : [...prev, productId]
    );
  };

  const toggleCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(c => c !== campaignId)
        : [...prev, campaignId]
    );
  };

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
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Filter className={`h-3 w-3 ${selectedProducts.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Filtrar por Produto</p>
                      {availableProducts && availableProducts.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {availableProducts.map(product => (
                            <div key={product.id} className="flex items-center gap-2">
                              <Checkbox
                                id={product.id}
                                checked={selectedProducts.includes(product.id)}
                                onCheckedChange={() => toggleProduct(product.id)}
                              />
                              <label htmlFor={product.id} className="text-sm cursor-pointer truncate">
                                {product.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
                      )}
                      <Button 
                        size="sm" 
                        className="w-full" 
                        onClick={() => saveProductFilters.mutate(selectedProducts)}
                        disabled={saveProductFilters.isPending}
                      >
                        {saveProductFilters.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {totalSales} vendas
                {selectedProducts.length > 0 && ` • ${selectedProducts.length} produto(s)`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gasto em Ads</CardTitle>
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Filter className={`h-3 w-3 ${selectedCampaigns.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Filtrar por Campanha</p>
                      {availableCampaigns && availableCampaigns.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {availableCampaigns.map(campaign => (
                            <div key={campaign.id} className="flex items-center gap-2">
                              <Checkbox
                                id={campaign.id}
                                checked={selectedCampaigns.includes(campaign.id)}
                                onCheckedChange={() => toggleCampaign(campaign.id)}
                              />
                              <label htmlFor={campaign.id} className="text-sm cursor-pointer truncate">
                                {campaign.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma campanha encontrada</p>
                      )}
                      <Button 
                        size="sm" 
                        className="w-full" 
                        onClick={() => saveCampaignFilters.mutate(selectedCampaigns)}
                        disabled={saveCampaignFilters.isPending}
                      >
                        {saveCampaignFilters.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{formatCurrency(totalSpend)}</div>
              <p className="text-xs text-muted-foreground">
                {totalClicks} cliques
                {selectedCampaigns.length > 0 && ` • ${selectedCampaigns.length} campanha(s)`}
              </p>
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
            ) : filteredAdSpend && filteredAdSpend.length > 0 ? (
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
                    const grouped = filteredAdSpend.reduce((acc, row) => {
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
