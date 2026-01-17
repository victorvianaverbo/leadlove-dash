import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderOpen, LogOut, Loader2, TrendingUp, DollarSign, Target, BarChart3, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: projectMetrics } = useQuery({
    queryKey: ['project-metrics'],
    queryFn: async () => {
      const [salesResult, spendResult] = await Promise.all([
        supabase.from('sales').select('project_id, amount'),
        supabase.from('ad_spend').select('project_id, spend')
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
  });

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-xl shadow-primary">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">MetrikaPRO</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="icon" asChild title="Documentação">
              <Link to="/documentacao">
                <HelpCircle className="h-5 w-5" />
              </Link>
            </Button>
            <Button onClick={() => navigate('/projects/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus projetos e métricas</p>
        </div>

        {/* Projects */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Seus Projetos</h2>
          {projectsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando projetos...
            </div>
          ) : projects?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-primary-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground mb-6">Você ainda não tem projetos</p>
                <Button onClick={() => navigate('/projects/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects?.map((project, index) => {
                const { revenue, spend, roas } = getProjectMetrics(project.id);
                return (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-primary overflow-hidden group"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 rounded-xl bg-primary-soft/50">
                          <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <DollarSign className="h-4 w-4 text-success" />
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Faturamento</p>
                          <p className="text-sm font-bold text-success mt-1">
                            R$ {formatCurrency(revenue)}
                          </p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-primary-soft/50">
                          <div className="w-8 h-8 bg-info/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Target className="h-4 w-4 text-info" />
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Investimento</p>
                          <p className="text-sm font-bold text-info mt-1">
                            R$ {formatCurrency(spend)}
                          </p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-primary-soft/50">
                          <div className={`w-8 h-8 ${roas >= 1 ? 'bg-success/10' : 'bg-destructive/10'} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                            <TrendingUp className={`h-4 w-4 ${roas >= 1 ? 'text-success' : 'text-destructive'}`} />
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">ROAS</p>
                          <p className={`text-sm font-bold mt-1 ${roas >= 1 ? 'text-success' : 'text-destructive'}`}>
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
      </main>
    </div>
  );
}
