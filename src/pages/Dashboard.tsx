import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, LogOut, Loader2, BarChart3, HelpCircle, Crown, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import { STRIPE_PLANS } from "@/lib/stripe-plans";
import { toast } from "@/hooks/use-toast";
import { DeleteProjectDialog } from "@/components/DeleteProjectDialog";
import { OnboardingTour } from "@/components/onboarding";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import { 
  ProjectCard, 
  PlanCard, 
  DashboardHeader, 
  NewProjectCard, 
  EmptyState 
} from "@/components/dashboard";

// Skeleton component for loading state
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Plan Card Skeleton */}
      <div className="h-24 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 animate-pulse" />
      
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-20 w-36 rounded-xl" />
          <Skeleton className="h-20 w-32 rounded-xl" />
        </div>
      </div>
      
      {/* Projects Grid Skeleton */}
      <div>
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-1 bg-primary/30" />
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-20 rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-7 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut, subscribed, subscriptionTier, subscriptionEnd, subscriptionLoading } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const queryClient = useQueryClient();
  const { showTour, finishTour } = useOnboardingTour();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Query for user profile
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expired');
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === 'Session expired') return false;
      return failureCount < 3;
    },
  });

  // Query for project integrations
  const { data: projectIntegrations } = useQuery({
    queryKey: ['project-integrations', projects?.map(p => p.id)],
    queryFn: async () => {
      const { data } = await supabase
        .from('integrations')
        .select('project_id, type, is_active')
        .in('project_id', projects?.map(p => p.id) || [])
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!projects?.length,
  });

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
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

      const [salesResult, spendResult] = await Promise.all([
        supabase.from('sales').select('project_id, amount, gross_amount').eq('status', 'paid').gte('sale_date', dateFilter),
        supabase.from('ad_spend').select('project_id, spend').gte('date', dateFilter)
      ]);

      const metrics: Record<string, { revenue: number; spend: number }> = {};

      const projectSettings = new Map(projects.map(p => [
        p.id,
        {
          useGross: (p as any).use_gross_for_roas || false,
          ticketPrice: (p as any).kiwify_ticket_price || null
        }
      ]));

      const salesCountByProject: Record<string, number> = {};
      salesResult.data?.forEach((sale: any) => {
        salesCountByProject[sale.project_id] = (salesCountByProject[sale.project_id] || 0) + 1;
      });

      salesResult.data?.forEach((sale: any) => {
        if (!metrics[sale.project_id]) {
          metrics[sale.project_id] = { revenue: 0, spend: 0 };
        }
        
        const settings = projectSettings.get(sale.project_id);
        const ticketPrice = settings?.ticketPrice;
        
        if (ticketPrice && metrics[sale.project_id].revenue === 0) {
          const salesCount = salesCountByProject[sale.project_id] || 0;
          metrics[sale.project_id].revenue = salesCount * ticketPrice;
        } else if (!ticketPrice) {
          const useGross = settings?.useGross;
          const valueToUse = useGross ? (sale.gross_amount || sale.amount) : sale.amount;
          metrics[sale.project_id].revenue += Number(valueToUse) || 0;
        }
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
    staleTime: 2 * 60 * 1000,
  });

  // Calculate global metrics
  const globalMetrics = useMemo(() => {
    if (!projectMetrics || !projects?.length) {
      return { totalRevenue: 0, totalSpend: 0, averageRoas: 0 };
    }

    let totalRevenue = 0;
    let totalSpend = 0;

    Object.values(projectMetrics).forEach((m) => {
      totalRevenue += m.revenue;
      totalSpend += m.spend;
    });

    const averageRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return { totalRevenue, totalSpend, averageRoas };
  }, [projectMetrics, projects]);

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
      await supabase.from('daily_reports').delete().eq('project_id', projectId);
      await supabase.from('integrations').delete().eq('project_id', projectId);
      await supabase.from('ad_spend').delete().eq('project_id', projectId);
      await supabase.from('sales').delete().eq('project_id', projectId);
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['project-integrations'] });
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

  const getProjectIntegrations = (projectId: string) => {
    return projectIntegrations?.filter(i => i.project_id === projectId) || [];
  };

  const currentPlan = subscriptionTier ? STRIPE_PLANS[subscriptionTier] : null;
  const projectLimit = currentPlan?.projects ?? 0;
  const canCreateProject = projectLimit === -1 || (projects?.length ?? 0) < projectLimit;
  const isMaxPlan = subscriptionTier === 'agencia';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Logo + Plan Badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 gradient-primary rounded-lg sm:rounded-xl shadow-purple-sm">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="font-bold text-lg sm:text-xl font-display">MetrikaPRO</span>
              {subscribed && currentPlan && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Crown className="h-3 w-3 text-primary" />
                  <span className="hidden sm:inline">{currentPlan.name}</span>
                </Badge>
              )}
              {subscriptionLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 sm:h-9 sm:w-9" 
                asChild 
                title="Configurações da conta"
              >
                <Link to="/settings">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <Button 
                id="tour-documentation"
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 sm:h-9 sm:w-9" 
                asChild 
                title="Documentação"
              >
                <Link to="/documentacao">
                  <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              {subscribed && (
                <Button 
                  id="tour-manage-subscription"
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
                  id="tour-new-project"
                  onClick={() => navigate('/projects/new')}
                  variant={canCreateProject ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm ${canCreateProject ? 'gradient-primary border-0' : ''}`}
                  disabled={!canCreateProject}
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
        {/* Show skeleton while loading */}
        {(subscriptionLoading || projectsLoading) ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* No Subscription Card */}
            {!subscribed && (
              <Card className="mb-6 sm:mb-8 border-primary/20 bg-primary/5">
                <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg font-display">Você ainda não tem uma assinatura ativa</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                        Escolha um plano para começar a criar projetos.
                      </p>
                    </div>
                    <Button asChild size="sm" className="w-full sm:w-auto gradient-primary border-0">
                      <Link to="/pricing">Ver Planos</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plan Card */}
            {subscribed && currentPlan && (
              <div id="tour-plan-card" className="mb-6 sm:mb-8">
                <PlanCard
                  planName={currentPlan.name}
                  projectCount={projects?.length ?? 0}
                  projectLimit={projectLimit}
                  subscriptionEnd={subscriptionEnd}
                  isMaxPlan={isMaxPlan}
                />
              </div>
            )}

            {/* Dashboard Header with Summary */}
            <DashboardHeader
              userName={profile?.full_name}
              projectCount={projects?.length ?? 0}
              totalRevenue={globalMetrics.totalRevenue}
              averageRoas={globalMetrics.averageRoas}
            />

            {/* Projects Section */}
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 tracking-tight font-display">
                Seus Projetos
              </h2>
              
              {!subscribed && (!projects || projects.length === 0) ? (
                <EmptyState hasSubscription={false} />
              ) : projects?.length === 0 ? (
                <EmptyState 
                  hasSubscription={true}
                  onCreateProject={() => navigate('/projects/new')}
                />
              ) : (
                <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {projects?.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      metrics={getProjectMetrics(project.id)}
                      integrations={getProjectIntegrations(project.id)}
                      onDelete={(e) => handleDeleteClick(e, { id: project.id, name: project.name })}
                      onClick={() => navigate(`/projects/${(project as any).slug || project.id}`)}
                      index={index}
                    />
                  ))}
                  
                  {/* New Project Card */}
                  <NewProjectCard
                    onClick={() => navigate('/projects/new')}
                    disabled={!canCreateProject}
                  />
                </div>
              )}
            </div>
          </>
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

      {/* Onboarding Tour */}
      <OnboardingTour run={showTour} onFinish={finishTour} />
    </div>
  );
}
