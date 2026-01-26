import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FolderOpen, LogOut, Loader2, TrendingUp, DollarSign, Target, BarChart3, HelpCircle, Crown, Settings, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { STRIPE_PLANS } from "@/lib/stripe-plans";
import { toast } from "@/hooks/use-toast";
import { DeleteProjectDialog } from "@/components/DeleteProjectDialog";

// Skeleton component for loading state
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Plan Card Skeleton */}
      <Card className="border-border">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Projects Section */}
      <div>
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between py-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut, subscribed, subscriptionTier, subscriptionEnd, subscriptionLoading } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      // Verificar se sessão ainda é válida
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expired');
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      // Não tentar novamente se sessão expirou
      if (error instanceof Error && error.message === 'Session expired') return false;
      return failureCount < 3;
    },
  });

  // Se sessão expirou, redirecionar para login
  useEffect(() => {
    if (projectsError instanceof Error && projectsError.message === 'Session expired') {
      signOut();
      navigate('/auth');
    }
  }, [projectsError, signOut, navigate]);

  const { data: projectMetrics } = useQuery({
    queryKey: ['project-metrics', projects?.map(p => p.id)],
    queryFn: async () => {
      if (!projects?.length) return {};
      
      // Limitar aos últimos 30 dias para carregamento mais rápido
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

      const [salesResult, spendResult] = await Promise.all([
        supabase.from('sales').select('project_id, amount, gross_amount').eq('status', 'paid').gte('sale_date', dateFilter),
        supabase.from('ad_spend').select('project_id, spend').gte('date', dateFilter)
      ]);

      const metrics: Record<string, { revenue: number; spend: number }> = {};

      // Create a map of project settings for quick lookup
      const projectSettings = new Map(projects.map(p => [p.id, (p as any).use_gross_for_roas || false]));

      salesResult.data?.forEach((sale: any) => {
        if (!metrics[sale.project_id]) {
          metrics[sale.project_id] = { revenue: 0, spend: 0 };
        }
        // Use gross_amount when project has use_gross_for_roas enabled
        const useGross = projectSettings.get(sale.project_id);
        const valueToUse = useGross ? (sale.gross_amount || sale.amount) : sale.amount;
        metrics[sale.project_id].revenue += Number(valueToUse) || 0;
      });

      spendResult.data?.forEach((ad) => {
        if (!metrics[ad.project_id]) {
          metrics[ad.project_id] = { revenue: 0, spend: 0 };
        }
        metrics[ad.project_id].spend += Number(ad.spend) || 0;
      });

      return metrics;
    },
    enabled: !!user && !!projects?.length,
    staleTime: 2 * 60 * 1000, // 2 minutos de cache
  });

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: 'Erro ao abrir portal',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      // Delete related data first
      await supabase.from('daily_reports').delete().eq('project_id', projectId);
      await supabase.from('integrations').delete().eq('project_id', projectId);
      await supabase.from('ad_spend').delete().eq('project_id', projectId);
      await supabase.from('sales').delete().eq('project_id', projectId);
      // Delete project
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-metrics'] });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      toast({
        title: 'Projeto excluído!',
        description: 'O projeto e todos os dados foram removidos.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, project: { id: string; name: string }) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getProjectMetrics = (projectId: string) => {
    const metrics = projectMetrics?.[projectId] || { revenue: 0, spend: 0 };
    const roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;
    return { ...metrics, roas };
  };

  const currentPlan = subscriptionTier ? STRIPE_PLANS[subscriptionTier] : null;
  const projectLimit = currentPlan?.projects ?? 0;
  const canCreateProject = projectLimit === -1 || (projects?.length ?? 0) < projectLimit;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Mobile: Stack layout */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Logo + Plan Badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary rounded-lg sm:rounded-xl">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg sm:text-xl">MetrikaPRO</span>
              {subscribed && currentPlan && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Crown className="h-3 w-3" />
                  <span className="hidden sm:inline">{currentPlan.name}</span>
                </Badge>
              )}
              {subscriptionLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" asChild title="Documentação">
                <Link to="/documentacao">
                  <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              {subscribed && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Settings className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Gerenciar</span>
                    </>
                  )}
                </Button>
              )}
              {subscribed && (
                <Button 
                  onClick={() => navigate('/projects/new')}
                  variant={canCreateProject ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{canCreateProject ? 'Novo Projeto' : 'Limite'}</span>
                </Button>
              )}
              <Button variant="outline" onClick={signOut} size="sm" className="h-8 sm:h-9 px-2 sm:px-3">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 font-light">Gerencie seus projetos e métricas</p>
        </div>

        {/* Subscription Info */}
        {!subscribed && !subscriptionLoading && (
          <Card className="mb-6 sm:mb-8 border-border">
            <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">Você ainda não tem uma assinatura ativa</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                    Escolha um plano para começar a criar projetos.
                  </p>
                </div>
                <Button asChild size="sm" className="w-full sm:w-auto">
                  <Link to="/pricing">Ver Planos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {subscribed && currentPlan && (
          <Card className="mb-6 sm:mb-8 border-success/20 bg-success/5">
            <CardContent className="py-3 sm:py-4 px-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base">Plano {currentPlan.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {projectLimit === -1 
                        ? 'Projetos ilimitados' 
                        : `${projects?.length ?? 0}/${projectLimit} projetos`}
                      {subscriptionEnd && (
                        <span className="hidden sm:inline"> • Renova em {new Date(subscriptionEnd).toLocaleDateString('pt-BR')}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show skeleton while loading subscription or projects */}
        {(subscriptionLoading || projectsLoading) ? (
          <DashboardSkeleton />
        ) : (
        /* Projects */
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 tracking-tight">Seus Projetos</h2>
          {!subscribed ? (
            <Card className="border-dashed">
              <CardContent className="py-8 sm:py-12 text-center px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-soft rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Assine um plano para criar projetos</p>
                <Button asChild size="sm">
                  <Link to="/pricing">Ver Planos</Link>
                </Button>
              </CardContent>
            </Card>
          ) : projects?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 sm:py-12 text-center px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-soft rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Você ainda não tem projetos</p>
                <Button onClick={() => navigate('/projects/new')} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {projects?.map((project, index) => {
                const { revenue, spend, roas } = getProjectMetrics(project.id);
                const isPositiveRoas = roas >= 1;
                
                return (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200 overflow-hidden group relative"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Header */}
                    <CardHeader className="pb-4 p-5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteClick(e, { id: project.id, name: project.name })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {project.last_sync_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Atualizado em {new Date(project.last_sync_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-3">
                      {/* Faturamento */}
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Faturamento</span>
                        <span className="text-sm font-semibold text-success">
                          R$ {formatCurrency(revenue)}
                        </span>
                      </div>
                      
                      {/* Investimento */}
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Investimento</span>
                        <span className="text-sm font-semibold text-destructive">
                          R$ {formatCurrency(spend)}
                        </span>
                      </div>
                      
                      {/* ROAS */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">ROAS</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${isPositiveRoas ? 'text-success' : 'text-destructive'}`}>
                            {roas.toFixed(2)}x
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 h-5 ${
                              isPositiveRoas 
                                ? 'border-success/30 text-success bg-success/5' 
                                : 'border-destructive/30 text-destructive bg-destructive/5'
                            }`}
                          >
                            {isPositiveRoas ? 'Lucrativo' : 'Negativo'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* Delete Project Dialog */}
        <DeleteProjectDialog
          projectName={projectToDelete?.name || ''}
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
          }}
          onConfirm={() => {
            if (projectToDelete) {
              deleteProject.mutate(projectToDelete.id);
            }
          }}
          isDeleting={deleteProject.isPending}
        />
      </main>
    </div>
  );
}
