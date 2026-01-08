import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderOpen, LogOut, Loader2, TrendingUp, DollarSign, Target } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getProjectMetrics = (projectId: string) => {
    const metrics = projectMetrics?.[projectId] || { revenue: 0, spend: 0 };
    const roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;
    return { ...metrics, roas };
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Gerencie seus projetos e métricas</p>
          </div>
          <div className="flex gap-2">
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

        {/* Projects */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Seus Projetos</h2>
          {projectsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando projetos...
            </div>
          ) : projects?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Você ainda não tem projetos</p>
                <Button onClick={() => navigate('/projects/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects?.map((project) => {
                const { revenue, spend, roas } = getProjectMetrics(project.id);
                return (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center mb-1">
                            <DollarSign className="h-3 w-3 text-green-600" />
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Faturamento</p>
                          <p className="text-sm font-semibold text-green-600">
                            R$ {formatCurrency(revenue)}
                          </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center mb-1">
                            <Target className="h-3 w-3 text-blue-600" />
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Investimento</p>
                          <p className="text-sm font-semibold text-blue-600">
                            R$ {formatCurrency(spend)}
                          </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center mb-1">
                            <TrendingUp className={`h-3 w-3 ${roas >= 1 ? 'text-green-600' : 'text-red-500'}`} />
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">ROAS</p>
                          <p className={`text-sm font-bold ${roas >= 1 ? 'text-green-600' : 'text-red-500'}`}>
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
      </div>
    </div>
  );
}