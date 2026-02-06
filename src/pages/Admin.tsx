import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ArrowLeft, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { EditUserModal } from "@/components/admin/EditUserModal";
import { STRIPE_PLANS, getPlanByProductId, PlanKey } from "@/lib/stripe-plans";

interface UserData {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  project_count: number;
  is_admin: boolean;
  override: { extra_projects: number; notes: string | null } | null;
  subscription: {
    subscribed: boolean;
    plan: string | null;
    product_id: string | null;
    status: string | null;
    subscription_end: string | null;
  };
}

export default function Admin() {
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const getFreshToken = async () => {
    const { data } = await supabase.auth.refreshSession();
    return data?.session?.access_token || session?.access_token;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!session?.access_token) return;

      try {
        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user?.id)
          .eq("role", "admin")
          .single();

        if (!roleData) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAdmin(true);

        // Fetch users from admin endpoint with fresh token
        const freshToken = await getFreshToken();
        const { data, error } = await supabase.functions.invoke("admin-users", {
          headers: { Authorization: `Bearer ${freshToken}` },
        });

        if (error) throw error;

        setUsers(data.users || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    if (session?.access_token && user) {
      checkAdminAndFetch();
    }
  }, [session?.access_token, user]);

  const handleRefresh = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    try {
      const freshToken = await getFreshToken();
      const { data, error } = await supabase.functions.invoke("admin-users", {
        headers: { Authorization: `Bearer ${freshToken}` },
      });

      if (error) throw error;

      setUsers(data.users || []);
      toast.success("Dados atualizados");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao atualizar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userData: UserData) => {
    setSelectedUser(userData);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (data: {
    userId: string;
    email: string;
    password?: string;
    isAdmin: boolean;
    extraProjects: number;
    notes: string;
  }) => {
    if (!session?.access_token) return;

    try {
      const freshToken = await getFreshToken();
      const { error } = await supabase.functions.invoke("admin-users", {
        headers: { Authorization: `Bearer ${freshToken}` },
        body: {
          user_id: data.userId,
          email: data.email,
          password: data.password,
          is_admin: data.isAdmin,
          extra_projects: data.extraProjects,
          notes: data.notes,
        },
      });

      if (error) throw error;

      toast.success("Usuário atualizado com sucesso");
      setIsEditModalOpen(false);
      handleRefresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao atualizar usuário");
    }
  };

  const getPlanName = (productId: string | null): string => {
    if (!productId) return "Sem plano";
    const planKey = getPlanByProductId(productId);
    if (!planKey) return "Desconhecido";
    return STRIPE_PLANS[planKey].name;
  };

  const getProjectLimit = (userData: UserData): number => {
    const productId = userData.subscription.product_id;
    const planKey = productId ? getPlanByProductId(productId) : null;
    const baseLimit = planKey ? STRIPE_PLANS[planKey].projects : 0;
    // -1 means unlimited
    if (baseLimit === -1) return 999;
    const extraProjects = userData.override?.extra_projects || 0;
    return baseLimit + extraProjects;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary text-primary-foreground">Ativo</Badge>;
      case "trialing":
        return <Badge variant="secondary">Trial</Badge>;
      case "canceled":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "past_due":
        return <Badge variant="outline" className="border-destructive text-destructive">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">Inativo</Badge>;
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(term) ||
      u.full_name?.toLowerCase().includes(term)
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
                <Shield className="h-6 w-6" />
                Painel Administrativo
              </h1>
              <p className="text-muted-foreground font-light">
                Gerenciar usuários e assinaturas
              </p>
            </div>
          </div>
          <Button onClick={handleRefresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Atualizar
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email ou nome..."
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
                    <th className="text-left py-3 px-4 font-medium">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium">Plano</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Admin</th>
                    <th className="text-left py-3 px-4 font-medium">Projetos</th>
                    <th className="text-left py-3 px-4 font-medium">Projetos</th>
                    <th className="text-left py-3 px-4 font-medium">Override</th>
                    <th className="text-left py-3 px-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userData) => (
                    <tr key={userData.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{userData.full_name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{userData.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getPlanName(userData.subscription.product_id)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(userData.subscription.status)}
                      </td>
                      <td className="py-3 px-4">
                        {userData.is_admin ? (
                          <Badge className="bg-primary text-primary-foreground">Admin</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={userData.project_count >= getProjectLimit(userData) ? "text-destructive font-medium" : ""}>
                          {userData.project_count} / {getProjectLimit(userData)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {userData.override?.extra_projects ? (
                          <Badge variant="outline" className="bg-primary/10">
                            +{userData.override.extra_projects}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(userData)}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <EditUserModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveUser}
        currentAdminId={user?.id}
      />
    </div>
  );
}
