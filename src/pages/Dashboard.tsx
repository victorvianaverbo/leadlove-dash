import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Settings, LogOut, FolderOpen, BarChart3, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['integrations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const hasKiwify = integrations?.some(i => i.type === 'kiwify' && i.is_active);
  const hasMeta = integrations?.some(i => i.type === 'meta_ads' && i.is_active);
  const needsSetup = !hasKiwify || !hasMeta;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Dashboard de Vendas</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Setup Alert */}
        {needsSetup && (
          <Card className="mb-8 border-amber-500/50 bg-amber-500/10">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium">Configure suas integrações</p>
                <p className="text-sm text-muted-foreground">
                  {!hasKiwify && !hasMeta && 'Conecte sua conta Kiwify e Meta Ads para começar.'}
                  {hasKiwify && !hasMeta && 'Conecte sua conta Meta Ads para calcular o ROAS.'}
                  {!hasKiwify && hasMeta && 'Conecte sua conta Kiwify para ver as vendas.'}
                </p>
              </div>
              <Button asChild>
                <Link to="/settings">Configurar</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Projects Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Meus Projetos</h2>
            <p className="text-muted-foreground">Gerencie seus projetos de vendas</p>
          </div>
          <Button asChild disabled={needsSetup}>
            <Link to="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Link>
          </Button>
        </div>

        {projectsLoading || integrationsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    {project.name}
                  </CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{project.kiwify_product_ids?.length || 0} produtos</span>
                    <span>{project.meta_campaign_ids?.length || 0} campanhas</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum projeto ainda</h3>
              <p className="text-muted-foreground mb-4">
                {needsSetup 
                  ? 'Configure suas integrações primeiro para criar projetos.'
                  : 'Crie seu primeiro projeto para começar a acompanhar suas vendas.'}
              </p>
              {!needsSetup && (
                <Button asChild>
                  <Link to="/projects/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Projeto
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
