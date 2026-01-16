import { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, RefreshCw, Settings, DollarSign, TrendingUp, ShoppingCart, Target, Eye, Users, Repeat, BarChart3, MousePointer, FileText, Percent, Wallet, Play, Video, CheckCircle, CalendarIcon, Save, Share2, Link2, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type DateRange = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all';

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // Editable project settings
  const [investmentValue, setInvestmentValue] = useState<number>(0);
  const [investmentDisplay, setInvestmentDisplay] = useState<string>('R$ 0,00');
  const [classDate, setClassDate] = useState<Date | undefined>(undefined);
  const [campaignObjective, setCampaignObjective] = useState<string>('sales');
  const [accountStatus, setAccountStatus] = useState<string>('active');
  const [adType, setAdType] = useState<string>('flex');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Currency formatting helpers
  const formatCurrencyInput = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const parseCurrencyInput = (value: string): number => {
    const cleanValue = value
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

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

  // Sync editable fields when project data loads
  useEffect(() => {
    if (project) {
      const value = Number(project.investment_value) || 0;
      setInvestmentValue(value);
      setInvestmentDisplay(formatCurrencyInput(value));
      setClassDate(project.class_date ? new Date(project.class_date) : undefined);
      setCampaignObjective(project.campaign_objective || 'sales');
      setAccountStatus(project.account_status || 'active');
      setAdType(project.ad_type || 'flex');
      setIsPublic((project as any).is_public || false);
      setShareToken((project as any).share_token || null);
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
      case 'all': {
        // Limitar "Todo período" para os últimos 6 meses
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
      // Ensure we have a valid session before calling the edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      
      const { error, data } = await supabase.functions.invoke('sync-project-data', {
        body: { project_id: id },
      });
      
      if (error) throw error;
      
      // Check for error in response body (edge function may return 200 with error)
      if (data?.error) {
        throw new Error(data.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', id] });
      queryClient.invalidateQueries({ queryKey: ['ad_spend', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: 'Dados atualizados!', description: 'Vendas e gastos foram sincronizados.' });
    },
    onError: (error) => {
      const message = error.message.includes('Invalid token') 
        ? 'Sessão expirada. Recarregue a página e tente novamente.'
        : error.message;
      toast({ title: 'Erro ao sincronizar', description: message, variant: 'destructive' });
    },
  });

  // Mutation to save project settings
  const updateProjectSettings = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('projects')
        .update({
          investment_value: investmentValue,
          class_date: classDate?.toISOString() || null,
          campaign_objective: campaignObjective,
          account_status: accountStatus,
          ad_type: adType
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: 'Configurações salvas!', description: 'As configurações do projeto foram atualizadas.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  // Mutation to toggle public sharing
  const togglePublicSharing = useMutation({
    mutationFn: async (newIsPublic: boolean) => {
      const { error } = await supabase
        .from('projects')
        .update({ is_public: newIsPublic } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, newIsPublic) => {
      setIsPublic(newIsPublic);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ 
        title: newIsPublic ? 'Link público ativado!' : 'Link público desativado!',
        description: newIsPublic ? 'O cliente pode acessar o dashboard pelo link.' : 'O link de compartilhamento foi desativado.'
      });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const getPublicUrl = () => {
    if (!shareToken) return '';
    return `${window.location.origin}/public/dashboard/${shareToken}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Link copiado!', description: 'O link foi copiado para a área de transferência.' });
  };

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

  // Funnel metrics from Meta
  const totalImpressions = filteredAdSpend?.reduce((sum, a) => sum + a.impressions, 0) || 0;
  const totalReach = filteredAdSpend?.reduce((sum, a) => sum + (a.reach || 0), 0) || 0;
  const totalLandingPageViews = filteredAdSpend?.reduce((sum, a) => sum + (a.landing_page_views || 0), 0) || 0;
  const totalLinkClicks = filteredAdSpend?.reduce((sum, a) => sum + (a.link_clicks || 0), 0) || 0;

  // Get daily budget from most recent ad spend record (it's the same for all records of a campaign)
  const dailyBudget = filteredAdSpend?.[0]?.daily_budget || 0;

  // New metrics: checkouts, thruplays, video 3s views
  const totalCheckoutsInitiated = filteredAdSpend?.reduce((sum, a) => sum + (a.checkouts_initiated || 0), 0) || 0;
  const totalThruplays = filteredAdSpend?.reduce((sum, a) => sum + (a.thruplays || 0), 0) || 0;
  const totalVideo3sViews = filteredAdSpend?.reduce((sum, a) => sum + (a.video_3s_views || 0), 0) || 0;

  // Calculated funnel metrics
  const avgFrequency = totalReach > 0 ? totalImpressions / totalReach : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const ctr = totalImpressions > 0 ? (totalLinkClicks / totalImpressions) * 100 : 0;

  // Hybrid metrics (Meta + Kiwify)
  const lpViewRate = totalLinkClicks > 0 ? (totalLandingPageViews / totalLinkClicks) * 100 : 0;
  const custoPerVenda = totalSales > 0 ? totalSpend / totalSales : 0;
  const vendaPerLP = totalLandingPageViews > 0 ? (totalSales / totalLandingPageViews) * 100 : 0;

  // New calculated rates
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
        {/* Project Settings - Editable Fields */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Configurações do Projeto</CardTitle>
            <CardDescription>Defina os parâmetros de acompanhamento do cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
              {/* Investimento */}
              <div className="space-y-2">
                <Label htmlFor="investment">Investimento</Label>
                <Input
                  id="investment"
                  type="text"
                  placeholder="R$ 0,00"
                  value={investmentDisplay}
                  onChange={(e) => {
                    const numericValue = parseCurrencyInput(e.target.value);
                    setInvestmentValue(numericValue);
                    setInvestmentDisplay(formatCurrencyInput(numericValue));
                  }}
                  onFocus={(e) => e.target.select()}
                />
              </div>

              {/* Data da Aula */}
              <div className="space-y-2">
                <Label>Data da Aula</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !classDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {classDate ? format(classDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={classDate}
                      onSelect={setClassDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Objetivo */}
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Select value={campaignObjective} onValueChange={setCampaignObjective}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Vendas</SelectItem>
                    <SelectItem value="leads">Leads</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={accountStatus} onValueChange={setAccountStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Anúncio */}
              <div className="space-y-2">
                <Label>Anúncio</Label>
                <Select value={adType} onValueChange={setAdType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flex">Flex</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botão Salvar */}
              <Button 
                onClick={() => updateProjectSettings.mutate()} 
                disabled={updateProjectSettings.isPending}
                className="w-full"
              >
                {updateProjectSettings.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share Dashboard Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Compartilhar Dashboard</CardTitle>
            </div>
            <CardDescription>Gere um link para o cliente visualizar o dashboard sem login</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-3">
                <Label htmlFor="public-toggle" className="text-sm">Link público</Label>
                <Button
                  id="public-toggle"
                  variant={isPublic ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePublicSharing.mutate(!isPublic)}
                  disabled={togglePublicSharing.isPending}
                >
                  {togglePublicSharing.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPublic ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Ativado
                    </>
                  ) : (
                    'Ativar'
                  )}
                </Button>
              </div>
              
              {isPublic && shareToken && (
                <div className="flex-1 flex gap-2 w-full sm:w-auto">
                  <div className="flex-1 flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
                    <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{getPublicUrl()}</span>
                  </div>
                  <Button variant="outline" size="icon" onClick={copyShareLink}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Orçamento Diário</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dailyBudget)}</div>
              <p className="text-xs text-muted-foreground">Meta Ads</p>
            </CardContent>
          </Card>

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

        {/* Funnel Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🎯 Funil de Mídia
          </h2>
          
          {/* Top of Funnel - Awareness */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Impressões</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalImpressions.toLocaleString('pt-BR')}</div>
                <p className="text-xs text-muted-foreground">Meta Ads</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Alcance</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReach.toLocaleString('pt-BR')}</div>
                <p className="text-xs text-muted-foreground">Pessoas únicas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Frequência</CardTitle>
                <Repeat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgFrequency.toFixed(2)}x</div>
                <p className="text-xs text-muted-foreground">Média por pessoa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">CPM</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(avgCPM)}</div>
                <p className="text-xs text-muted-foreground">Custo por mil</p>
              </CardContent>
            </Card>
          </div>

          {/* Video/Creative Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gancho Inicial (3s)</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVideo3sViews.toLocaleString('pt-BR')}</div>
                <p className="text-xs text-muted-foreground">Visualizações 3s</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">ThruPlays</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalThruplays.toLocaleString('pt-BR')}</div>
                <p className="text-xs text-muted-foreground">Retenção completa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tx. Engajamento Criativo</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{creativeEngagementRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">ThruPlays / Gancho 3s</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">CTR</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ctr.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">Cliques / Impressões</p>
              </CardContent>
            </Card>
          </div>

          {/* Middle of Funnel - Consideration */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cliques no Link</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLinkClicks.toLocaleString('pt-BR')}</div>
                <p className="text-xs text-muted-foreground">Meta Ads</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">CPC</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(avgCPC)}</div>
                <p className="text-xs text-muted-foreground">Custo por clique</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Views na LP</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLandingPageViews.toLocaleString('pt-BR')}</div>
                <p className="text-xs text-muted-foreground">Landing page</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa LP/Clique</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lpViewRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Conversão do clique</p>
              </CardContent>
            </Card>
          </div>

          {/* Bottom of Funnel - Conversion (Hybrid) */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Checkouts Iniciados</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCheckoutsInitiated.toLocaleString('pt-BR')}</div>
                <p className="text-xs text-muted-foreground">Meta Ads</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Custo p/ Checkout</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(custoPerCheckout)}</div>
                <p className="text-xs text-muted-foreground">Gasto ÷ Checkouts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tx. Conv. Checkout</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{checkoutConversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Vendas / Checkouts</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Vendas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalSales}</div>
                <p className="text-xs text-muted-foreground">Kiwify</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Custo por Venda</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(custoPerVenda)}</div>
                <p className="text-xs text-muted-foreground">Meta ÷ Kiwify</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa Venda/LP</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{vendaPerLP.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">Conversão final</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ad Spend by Campaign - Complete Metrics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Campanha</CardTitle>
            <CardDescription>Análise completa de métricas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            {adSpendLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredAdSpend && filteredAdSpend.length > 0 ? (
              (() => {
                // Group sales by date for row-level metrics
                const salesByDate = filteredSales?.reduce((acc, sale) => {
                  const dateKey = new Date(sale.sale_date).toISOString().split('T')[0];
                  if (!acc[dateKey]) acc[dateKey] = { count: 0, revenue: 0 };
                  acc[dateKey].count++;
                  acc[dateKey].revenue += Number(sale.amount);
                  return acc;
                }, {} as Record<string, { count: number; revenue: number }>) || {};

                return (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Campanha</TableHead>
                          <TableHead className="whitespace-nowrap">Data</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Gasto</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Faturamento</TableHead>
                          <TableHead className="text-right whitespace-nowrap">ROAS</TableHead>
                          <TableHead className="text-right whitespace-nowrap">CPA</TableHead>
                          <TableHead className="text-right whitespace-nowrap">CPC</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Views LP</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Taxa LP</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Checkout</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Custo/Checkout</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Conv. Checkout</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Vendas</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Custo/Venda</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Taxa Venda/LP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAdSpend.slice(0, 50).map((row) => {
                          const dateKey = row.date;
                          const daySales = salesByDate[dateKey] || { count: 0, revenue: 0 };
                          const revenue = daySales.revenue;
                          const salesCount = daySales.count;
                          const spend = Number(row.spend);
                          
                          // Per-row calculations
                          const rowRoas = spend > 0 ? revenue / spend : 0;
                          const rowCpa = salesCount > 0 ? spend / salesCount : 0;
                          const rowCpc = row.clicks > 0 ? spend / row.clicks : 0;
                          const lpViews = row.landing_page_views || 0;
                          const linkClicks = row.link_clicks || 0;
                          const taxaLp = linkClicks > 0 ? (lpViews / linkClicks) * 100 : 0;
                          const checkouts = row.checkouts_initiated || 0;
                          const custoCheckout = checkouts > 0 ? spend / checkouts : 0;
                          const convCheckout = checkouts > 0 ? (salesCount / checkouts) * 100 : 0;
                          const custoVenda = salesCount > 0 ? spend / salesCount : 0;
                          const taxaVendaLp = lpViews > 0 ? (salesCount / lpViews) * 100 : 0;
                          
                          return (
                            <TableRow key={row.id}>
                              <TableCell className="font-medium whitespace-nowrap">{row.campaign_name || row.campaign_id}</TableCell>
                              <TableCell className="whitespace-nowrap">{new Date(row.date).toLocaleDateString('pt-BR')}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{formatCurrency(spend)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap text-green-600">{formatCurrency(revenue)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{rowRoas.toFixed(2)}x</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{formatCurrency(rowCpa)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{formatCurrency(rowCpc)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{lpViews.toLocaleString('pt-BR')}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{taxaLp.toFixed(1)}%</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{checkouts.toLocaleString('pt-BR')}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{formatCurrency(custoCheckout)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{convCheckout.toFixed(1)}%</TableCell>
                              <TableCell className="text-right whitespace-nowrap text-green-600">{salesCount}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{formatCurrency(custoVenda)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{taxaVendaLp.toFixed(2)}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()
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