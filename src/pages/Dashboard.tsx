import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, LogOut, Loader2, TrendingUp, DollarSign, Target, BarChart3, HelpCircle, Crown, Settings, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { STRIPE_PLANS } from "@/lib/stripe-plans";
import { toast } from "@/hooks/use-toast";
import { DeleteProjectDialog } from "@/components/DeleteProjectDialog";

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
    queryKey: ['project-metrics'],
    queryFn: async () => {
      // Limitar aos últimos 30 dias para carregamento mais rápido
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

      const [salesResult, spendResult] = await Promise.all([
        supabase.from('sales').select('project_id, amount').gte('sale_date', dateFilter),
        supabase.from('ad_spend').select('project_id, spend').gte('date', dateFilter)
      ]);

      const metrics: Record<string, { revenue: number; spend: number }> = {};

      salesResult.data?.forEach((sale) => {
        if (!metrics[sale.project_id]) {
          metrics[sale.project_id] = { revenue: 0, spend: 0 };
        }
        metrics[sale.project_id].revenue += Number(sale.amount) || 0;
      });

      spendResult.data?.forEach((ad) => {
        if (!metrics[ad.project_id]) {
          metrics[ad.project_id] = { revenue: 0, spend: 0 };
        }
        metrics[ad.project_id].spend += Number(ad.spend) || 0;
      });

      return metrics;
    },
    enabled: !!user,
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

        {/* Projects */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 tracking-tight">Seus Projetos</h2>
          {projectsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando projetos...
            </div>
          ) : !subscribed ? (
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
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {projects?.map((project, index) => {
                const { revenue, spend, roas } = getProjectMetrics(project.id);
                return (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200 overflow-hidden group relative"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteClick(e, { id: project.id, name: project.name })}
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <CardHeader className="pb-2 sm:pb-3 pr-10 sm:pr-12 p-3 sm:p-6">
                      <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors truncate">{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary-soft/50">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-success/10 rounded-md sm:rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                          </div>
                          <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Faturamento</p>
                          <p className="text-[10px] sm:text-sm font-bold text-success mt-0.5 sm:mt-1 truncate">
                            R$ {formatCurrency(revenue)}
                          </p>
                        </div>
                        <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary-soft/50">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-info/10 rounded-md sm:rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-info" />
                          </div>
                          <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Investimento</p>
                          <p className="text-[10px] sm:text-sm font-bold text-info mt-0.5 sm:mt-1 truncate">
                            R$ {formatCurrency(spend)}
                          </p>
                        </div>
                        <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary-soft/50">
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 ${roas >= 1 ? 'bg-success/10' : 'bg-destructive/10'} rounded-md sm:rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2`}>
                            <TrendingUp className={`h-3 w-3 sm:h-4 sm:w-4 ${roas >= 1 ? 'text-success' : 'text-destructive'}`} />
                          </div>
                          <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wide font-medium">ROAS</p>
                          <p className={`text-[10px] sm:text-sm font-bold mt-0.5 sm:mt-1 ${roas >= 1 ? 'text-success' : 'text-destructive'}`}>
                            {roas.toFixed(2)}x
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

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
