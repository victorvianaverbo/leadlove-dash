import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ArrowLeft, Shield, FolderKanban, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ProjectData {
  id: string;
  name: string;
  slug: string | null;
  user_id: string;
  created_at: string;
  last_sync_at: string | null;
  is_public: boolean;
  owner: {
    user_id: string;
    full_name: string | null;
    email: string | null;
  };
  integrations: string[];
}

export default function AdminProjects() {
  const { user, session, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [syncingProjectId, setSyncingProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!session?.access_token || !isAdmin) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("admin-projects", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (error) throw error;

        setProjects(data.projects || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Erro ao carregar projetos");
      } finally {
        setLoading(false);
      }
    };

    if (session?.access_token && isAdmin) {
      fetchProjects();
    }
  }, [session?.access_token, isAdmin]);

  const handleRefresh = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-projects", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      setProjects(data.projects || []);
      toast.success("Lista atualizada");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao atualizar");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncProject = async (projectId: string) => {
    if (!session?.access_token) return;

    setSyncingProjectId(projectId);
    try {
      const { error, data } = await supabase.functions.invoke("sync-project-data", {
        body: { project_id: projectId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const salesCount = data?.salesSynced || 0;
      const adSpendCount = data?.adSpendSynced || 0;
      
      toast.success(`Sincronizado: ${salesCount} vendas, ${adSpendCount} registros de ads`);
      handleRefresh();
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setSyncingProjectId(null);
    }
  };

  const getIntegrationBadge = (type: string) => {
    const colors: Record<string, string> = {
      kiwify: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      hotmart: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      guru: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      eduzz: "bg-green-500/20 text-green-400 border-green-500/30",
      meta_ads: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    };

    const labels: Record<string, string> = {
      kiwify: "Kiwify",
      hotmart: "Hotmart",
      guru: "Guru",
      eduzz: "Eduzz",
      meta_ads: "Meta",
    };

    return (
      <Badge 
        key={type} 
        variant="outline" 
        className={colors[type] || "bg-muted text-muted-foreground"}
      >
        {labels[type] || type}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredProjects = projects.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.owner.full_name?.toLowerCase().includes(term) ||
      p.owner.email?.toLowerCase().includes(term)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2 tracking-tight">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-4 font-light">
              Você não tem permissão para acessar esta página.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
                <FolderKanban className="h-6 w-6" />
                Projetos (Admin)
              </h1>
              <p className="text-muted-foreground font-light">
                Visualizar e acessar projetos de todos os clientes
              </p>
            </div>
          </div>
          <Button onClick={handleRefresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Atualizar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Todos os Projetos ({filteredProjects.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por projeto, cliente ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Projeto</th>
                    <th className="text-left py-3 px-4 font-medium">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium">Integrações</th>
                    <th className="text-left py-3 px-4 font-medium">Última Sync</th>
                    <th className="text-left py-3 px-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {project.is_public && (
                              <Badge variant="outline" className="mr-2 text-xs">Público</Badge>
                            )}
                            {project.slug && <span className="opacity-50">/{project.slug}</span>}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{project.owner.full_name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{project.owner.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {project.integrations.length > 0 ? (
                            project.integrations.map((type) => getIntegrationBadge(type))
                          ) : (
                            <span className="text-muted-foreground text-sm">Nenhuma</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(project.last_sync_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncProject(project.id)}
                            disabled={syncingProjectId === project.id}
                          >
                            {syncingProjectId === project.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            asChild
                          >
                            <Link to={`/projects/${project.id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Acessar
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProjects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum projeto encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
