import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard, FunnelCard } from '@/components/ui/kpi-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useMetricsCache } from '@/hooks/useMetricsCache';

import { KpiGridSkeleton, FunnelSectionSkeleton, SettingsCardSkeleton } from '@/components/skeletons';
import { Loader2, ArrowLeft, RefreshCw, Settings, DollarSign, TrendingUp, ShoppingCart, Target, Eye, Users, Repeat, BarChart3, MousePointer, FileText, Percent, Wallet, Play, Video, CheckCircle, CalendarIcon, Save, Share2, Link2, Copy, Check, Trash2 } from 'lucide-react';
import { DeleteProjectDialog } from '@/components/DeleteProjectDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type DateRange = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all' | 'custom';

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  // Editable project settings
  const [investmentValue, setInvestmentValue] = useState<number>(0);
  const [investmentDisplay, setInvestmentDisplay] = useState<string>('R$ 0,00');
  const [classDate, setClassDate] = useState<Date | undefined>(undefined);
  const [campaignObjective, setCampaignObjective] = useState<string>('sales');
  const [accountStatus, setAccountStatus] = useState<string>('active');
  const [adType, setAdType] = useState<string>('flex');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [projectSlug, setProjectSlug] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Custom domain - use your published domain
  const PUBLIC_DOMAIN = 'https://metrikapro.com.br';

  // Generate slug from project name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')     // Replace special chars with dash
      .replace(/^-+|-+$/g, '');        // Remove leading/trailing dashes
  };

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

  // Helper to get date in Brasília timezone (UTC-3)
  const getBrasiliaDate = (daysAgo = 0): Date => {
    const now = new Date();
    const brasiliaOffset = -3 * 60; // UTC-3 in minutes
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const brasiliaTime = new Date(utcTime + brasiliaOffset * 60000);
    brasiliaTime.setDate(brasiliaTime.getDate() - daysAgo);
    return brasiliaTime;
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
      setProjectSlug((project as any).slug || generateSlug(project.name));
    }
  }, [project]);

  // Converte meia-noite de Brasília para UTC (+3 horas)
  const brasiliaToUTC = (date: Date): string => {
    date.setHours(0, 0, 0, 0);
    // Brasília é UTC-3, então meia-noite em Brasília = 03:00 UTC
    const utcDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    return utcDate.toISOString();
  };

  const getDateFilter = () => {
    switch (dateRange) {
      case 'today': {
        const today = getBrasiliaDate(0);
        return brasiliaToUTC(today);
      }
      case 'yesterday': {
        const yesterday = getBrasiliaDate(1);
        return brasiliaToUTC(yesterday);
      }
      case '7d': {
        const date = getBrasiliaDate(6); // 7 dias incluindo hoje
        return brasiliaToUTC(date);
      }
      case '30d': {
        const date = getBrasiliaDate(29); // 30 dias incluindo hoje
        return brasiliaToUTC(date);
      }
      case '90d': {
        const date = getBrasiliaDate(89); // 90 dias incluindo hoje
        return brasiliaToUTC(date);
      }
      case 'all': {
        // Limitar "Todo período" para os últimos 6 meses
        const date = getBrasiliaDate(179); // 180 dias incluindo hoje
        return brasiliaToUTC(date);
      }
      case 'custom': {
        if (customStartDate) {
          return brasiliaToUTC(new Date(customStartDate));
        }
        return null;
      }
      default: return null;
    }
  };

  const getEndDateFilter = () => {
    if (dateRange === 'yesterday') {
      const today = getBrasiliaDate(0);
      return brasiliaToUTC(today);
    }
    if (dateRange === 'custom' && customEndDate) {
      const endDate = new Date(customEndDate);
      endDate.setDate(endDate.getDate() + 1); // Incluir o dia final inteiro
      return brasiliaToUTC(endDate);
    }
    return null;
  };

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['sales', id, dateRange, customStartDate?.toISOString(), customEndDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select('*')
        .eq('project_id', id)
        .eq('status', 'paid')
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
    queryKey: ['ad_spend', id, dateRange, customStartDate?.toISOString(), customEndDate?.toISOString()],
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
      
      // Step 1: Sync data from Kiwify + Meta Ads
      const { error, data } = await supabase.functions.invoke('sync-project-data', {
        body: { project_id: id },
      });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      // Step 2: Generate updated AI report
      const { error: reportError } = await supabase.functions.invoke('generate-daily-report', {
        body: { project_id: id },
      });

      if (reportError) {
        console.error('Error generating report after sync:', reportError);
        // Don't throw - sync was successful, report generation is secondary
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', id] });
      queryClient.invalidateQueries({ queryKey: ['ad_spend', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: 'Dados atualizados!', description: 'Vendas, gastos e relatório foram sincronizados.' });
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
      // Generate slug if enabling and no slug exists
      const slug = projectSlug || generateSlug(project?.name || '');
      const { error } = await supabase
        .from('projects')
        .update({ is_public: newIsPublic, slug } as any)
        .eq('id', id);
      if (error) throw error;
      return slug;
    },
    onSuccess: (slug, newIsPublic) => {
      setIsPublic(newIsPublic);
      setProjectSlug(slug);
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

  // Mutation to delete project
  const deleteProject = useMutation({
    mutationFn: async () => {
      // Delete related data first
      await supabase.from('daily_reports').delete().eq('project_id', id);
      await supabase.from('integrations').delete().eq('project_id', id);
      await supabase.from('ad_spend').delete().eq('project_id', id);
      await supabase.from('sales').delete().eq('project_id', id);
      // Delete project
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Projeto excluído!',
        description: 'O projeto e todos os dados foram removidos.',
      });
      navigate('/dashboard');
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    },
  });


  const getPublicUrl = () => {
    if (!projectSlug) return '';
    return `${PUBLIC_DOMAIN}/${projectSlug}`;
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
  // Use gross_amount for ROAS calculation when use_gross_for_roas is enabled
  const useGrossForRoas = (project as any)?.use_gross_for_roas || false;
  
  // When ticket price is configured, use it for revenue calculation (quantity × ticket price)
  const ticketPrice = (project as any)?.kiwify_ticket_price 
    ? parseFloat((project as any).kiwify_ticket_price) 
    : null;
  
  // Memoize all metrics calculations for performance
  const calculatedMetrics = useMemo(() => {
    const totalRevenue = (() => {
      // Priority 1: If ticket price is configured, use it (quantity × price)
      if (ticketPrice) {
        return (filteredSales?.length || 0) * ticketPrice;
      }
      // Priority 2: Sum individual values (gross_amount if useGrossForRoas, otherwise amount)
      return filteredSales?.reduce((sum, s) => {
        const valueToUse = useGrossForRoas ? ((s as any).gross_amount || s.amount) : s.amount;
        return sum + Number(valueToUse);
      }, 0) || 0;
    })();
    
    const totalSpend = filteredAdSpend?.reduce((sum, a) => sum + Number(a.spend), 0) || 0;
    const totalSales = filteredSales?.length || 0;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // Funnel metrics from Meta
    const totalImpressions = filteredAdSpend?.reduce((sum, a) => sum + a.impressions, 0) || 0;
    const totalReach = filteredAdSpend?.reduce((sum, a) => sum + (a.reach || 0), 0) || 0;
    const totalLandingPageViews = filteredAdSpend?.reduce((sum, a) => sum + (a.landing_page_views || 0), 0) || 0;
    const totalLinkClicks = filteredAdSpend?.reduce((sum, a) => sum + (a.link_clicks || 0), 0) || 0;

    // Get daily budget from most recent ad spend record
    const dailyBudget = filteredAdSpend?.[0]?.daily_budget || 0;

    // New metrics: checkouts, thruplays, video 3s views
    const totalCheckoutsInitiated = filteredAdSpend?.reduce((sum, a) => sum + (a.checkouts_initiated || 0), 0) || 0;
    const totalThruplays = filteredAdSpend?.reduce((sum, a) => sum + (a.thruplays || 0), 0) || 0;
    const totalVideo3sViews = filteredAdSpend?.reduce((sum, a) => sum + (a.video_3s_views || 0), 0) || 0;

    // Calculated funnel metrics
    const avgFrequency = totalReach > 0 ? totalImpressions / totalReach : 0;
    const avgCPC = totalLinkClicks > 0 ? totalSpend / totalLinkClicks : 0;
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

    return {
      totalRevenue,
      totalSpend,
      totalSales,
      roas,
      totalImpressions,
      totalReach,
      totalLandingPageViews,
      totalLinkClicks,
      totalCheckoutsInitiated,
      totalThruplays,
      totalVideo3sViews,
      avgFrequency,
      avgCPC,
      avgCPM,
      ctr,
      lpViewRate,
      custoPerVenda,
      vendaPerLP,
      checkoutConversionRate,
      creativeEngagementRate,
      custoPerCheckout,
      dailyBudget,
    };
  }, [filteredSales, filteredAdSpend, ticketPrice, useGrossForRoas]);

  // Destructure for easier use in JSX
  const {
    totalRevenue, totalSpend, totalSales, roas,
    totalImpressions, totalReach, totalLandingPageViews, totalLinkClicks,
    totalCheckoutsInitiated, totalThruplays, totalVideo3sViews,
    avgFrequency, avgCPC, avgCPM, ctr,
    lpViewRate, custoPerVenda, vendaPerLP,
    checkoutConversionRate, creativeEngagementRate, custoPerCheckout, dailyBudget,
  } = calculatedMetrics;

  // Use metrics cache hook
  const { updateCache, isCacheValid } = useMetricsCache(id, dateRange);

  // Update cache when metrics change AND cache is invalid
  useEffect(() => {
    if (id && totalRevenue !== undefined && !salesLoading && !adSpendLoading && !isCacheValid) {
      // Update cache with calculated metrics (debounced internally)
      updateCache(calculatedMetrics);
    }
  }, [id, calculatedMetrics, salesLoading, adSpendLoading, isCacheValid]);


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
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Mobile: Stack layout */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Top row: Back button + Project name */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button variant="ghost" size="sm" className="flex-shrink-0 px-2 sm:px-3" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Voltar</span>
                </Link>
              </Button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold truncate">{project.name}</h1>
                {project.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{project.description}</p>
                )}
              </div>
            </div>
            
            {/* Bottom row on mobile: Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                <SelectTrigger className="w-[130px] sm:w-[160px] text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Custom date range pickers */}
              {dateRange === 'custom' && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-[110px] sm:w-[130px] justify-start text-left font-normal text-xs sm:text-sm",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                        {customStartDate ? format(customStartDate, "dd/MM/yy", { locale: ptBR }) : "De"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-[110px] sm:w-[130px] justify-start text-left font-normal text-xs sm:text-sm",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                        {customEndDate ? format(customEndDate, "dd/MM/yy", { locale: ptBR }) : "Até"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </>
              )}
              
              <Button onClick={() => syncData.mutate()} disabled={syncData.isPending} size="sm" className="px-2 sm:px-3">
                {syncData.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-1.5 hidden sm:inline">Atualizar</span>
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" asChild>
                <Link to={`/projects/${id}/edit`}>
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Project Settings - Editable Fields */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Configurações do Projeto</CardTitle>
            <CardDescription>Defina os parâmetros de acompanhamento do cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 items-end">
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
              
              {isPublic && projectSlug && (
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

        {/* Main KPI Cards */}
        {(salesLoading || adSpendLoading) ? (
          <div className="mb-6 sm:mb-8">
            <KpiGridSkeleton count={5} columns={5} />
          </div>
        ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6 sm:mb-8">
          <KpiCard
            title="Orçamento Diário"
            value={formatCurrency(dailyBudget)}
            subtitle="Meta Ads"
            icon={Wallet}
            variant="primary"
          />

          <KpiCard
            title="Faturamento"
            value={formatCurrency(totalRevenue)}
            subtitle={`${totalSales} vendas`}
            icon={DollarSign}
            variant="success"
          />

          <KpiCard
            title="Gasto em Ads"
            value={formatCurrency(totalSpend)}
            subtitle={`${totalLinkClicks.toLocaleString('pt-BR')} cliques no link`}
            icon={Target}
            variant="destructive"
          />

          <KpiCard
            title="ROAS"
            value={`${roas.toFixed(2)}x`}
            subtitle="Retorno sobre gasto"
            icon={TrendingUp}
            variant={roas >= 1 ? "success" : "destructive"}
          />

          <KpiCard
            title="CPA"
            value={totalSales > 0 ? formatCurrency(totalSpend / totalSales) : 'R$ 0,00'}
            subtitle="Custo por aquisição"
            icon={ShoppingCart}
            variant="info"
            className="col-span-2 md:col-span-1"
          />
        </div>
        )}

        {/* Funnel Section */}
        {(salesLoading || adSpendLoading) ? (
          <FunnelSectionSkeleton />
        ) : (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            🎯 Funil de Mídia
          </h2>
          
          {/* Top of Funnel - Awareness */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-3 sm:mb-4">
            <FunnelCard title="Impressões" value={totalImpressions.toLocaleString('pt-BR')} subtitle="Meta Ads" icon={Eye} />
            <FunnelCard title="Alcance" value={totalReach.toLocaleString('pt-BR')} subtitle="Pessoas únicas" icon={Users} />
            <FunnelCard title="Frequência" value={`${avgFrequency.toFixed(2)}x`} subtitle="Média por pessoa" icon={Repeat} />
            <FunnelCard title="CPM" value={formatCurrency(avgCPM)} subtitle="Custo por mil" icon={BarChart3} />
          </div>

          {/* Video/Creative Metrics */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-3 sm:mb-4">
            <FunnelCard title="Gancho (3s)" value={totalVideo3sViews.toLocaleString('pt-BR')} subtitle="Visualizações 3s" icon={Play} />
            <FunnelCard title="ThruPlays" value={totalThruplays.toLocaleString('pt-BR')} subtitle="Retenção completa" icon={Video} />
            <FunnelCard title="Tx. Engajamento" value={`${creativeEngagementRate.toFixed(1)}%`} subtitle="ThruPlays / Gancho" icon={Percent} />
            <FunnelCard title="CTR" value={`${ctr.toFixed(2)}%`} subtitle="Cliques / Impressões" icon={MousePointer} />
          </div>

          {/* Middle of Funnel - Consideration */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-3 sm:mb-4">
            <FunnelCard title="Cliques Link" value={totalLinkClicks.toLocaleString('pt-BR')} subtitle="Meta Ads" icon={MousePointer} />
            <FunnelCard title="CPC" value={formatCurrency(avgCPC)} subtitle="Custo por clique" icon={DollarSign} />
            <FunnelCard title="Views LP" value={totalLandingPageViews.toLocaleString('pt-BR')} subtitle="Landing page" icon={FileText} />
            <FunnelCard title="Taxa LP/Clique" value={`${lpViewRate.toFixed(1)}%`} subtitle="Conversão clique" icon={Percent} />
          </div>

          {/* Bottom of Funnel - Conversion (Hybrid) */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <FunnelCard title="Checkouts" value={totalCheckoutsInitiated.toLocaleString('pt-BR')} subtitle="Meta Ads" icon={CheckCircle} />
            <FunnelCard title="Custo/Checkout" value={formatCurrency(custoPerCheckout)} subtitle="Gasto ÷ Checkouts" icon={Wallet} />
            <FunnelCard title="Conv. Checkout" value={`${checkoutConversionRate.toFixed(1)}%`} subtitle="Vendas / Checkouts" icon={Percent} />
            <KpiCard title="Vendas" value={totalSales} subtitle="Kiwify" icon={ShoppingCart} variant="success" />
            <KpiCard title="Custo/Venda" value={formatCurrency(custoPerVenda)} subtitle="Meta ÷ Kiwify" icon={DollarSign} variant="success" />
            <KpiCard title="Taxa Venda/LP" value={`${vendaPerLP.toFixed(2)}%`} subtitle="Conversão final" icon={TrendingUp} variant="success" />
          </div>
        </div>
        )}


        <DeleteProjectDialog
          projectName={project?.name || ''}
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={() => deleteProject.mutate()}
          isDeleting={deleteProject.isPending}
        />
      </main>
    </div>
  );
}