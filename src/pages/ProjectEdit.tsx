import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  // Kiwify credentials
  const [kiwifyClientId, setKiwifyClientId] = useState("");
  const [kiwifyClientSecret, setKiwifyClientSecret] = useState("");
  const [kiwifyAccountId, setKiwifyAccountId] = useState("");
  const [showKiwifySecret, setShowKiwifySecret] = useState(false);

  // Meta credentials
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaAdAccountId, setMetaAdAccountId] = useState("");
  const [showMetaToken, setShowMetaToken] = useState(false);

  // Fetch project data
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
    enabled: !!id && !!user,
  });

  // Fetch project integrations
  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['project-integrations', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('project_id', id);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const kiwifyIntegration = integrations?.find(i => i.type === 'kiwify' && i.is_active);
  const metaIntegration = integrations?.find(i => i.type === 'meta_ads' && i.is_active);

  // Fetch Kiwify products
  const { data: kiwifyProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['kiwify-products', id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('kiwify-products', {
        body: { project_id: id }
      });
      if (error) throw error;
      return data?.products || [];
    },
    enabled: !!kiwifyIntegration,
  });

  // Fetch Meta campaigns
  const { data: metaCampaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['meta-campaigns', id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('meta-campaigns', {
        body: { project_id: id }
      });
      if (error) throw error;
      return data?.campaigns || [];
    },
    enabled: !!metaIntegration,
  });

  // Load project data into form
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setSelectedProducts(project.kiwify_product_ids || []);
      setSelectedCampaigns(project.meta_campaign_ids || []);
    }
  }, [project]);

  // Load integration credentials
  useEffect(() => {
    if (kiwifyIntegration) {
      const creds = kiwifyIntegration.credentials as { client_id?: string; client_secret?: string; account_id?: string };
      setKiwifyClientId(creds.client_id || "");
      setKiwifyClientSecret(creds.client_secret || "");
      setKiwifyAccountId(creds.account_id || "");
    }
    if (metaIntegration) {
      const creds = metaIntegration.credentials as { access_token?: string; ad_account_id?: string };
      setMetaAccessToken(creds.access_token || "");
      setMetaAdAccountId(creds.ad_account_id || "");
    }
  }, [kiwifyIntegration, metaIntegration]);

  // Save integration mutation
  const saveIntegration = useMutation({
    mutationFn: async ({ type, credentials }: { type: string; credentials: { client_id?: string; client_secret?: string; account_id?: string; access_token?: string; ad_account_id?: string } }) => {
      const existing = integrations?.find(i => i.type === type);
      const credentialsJson = JSON.parse(JSON.stringify(credentials));
      
      if (existing) {
        const { error } = await supabase
          .from('integrations')
          .update({ credentials: credentialsJson, is_active: true })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert([{
            user_id: user!.id,
            project_id: id,
            type,
            credentials: credentialsJson,
            is_active: true,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-integrations', id] });
      queryClient.invalidateQueries({ queryKey: ['kiwify-products', id] });
      queryClient.invalidateQueries({ queryKey: ['meta-campaigns', id] });
      toast({ title: "Integração salva com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar integração", description: error.message, variant: "destructive" });
    },
  });

  // Disconnect integration mutation
  const disconnectIntegration = useMutation({
    mutationFn: async (type: string) => {
      const existing = integrations?.find(i => i.type === type);
      if (existing) {
        const { error } = await supabase
          .from('integrations')
          .update({ is_active: false })
          .eq('id', existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-integrations', id] });
      toast({ title: "Integração desconectada!" });
    },
  });

  // Update project mutation
  const updateProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('projects')
        .update({
          name,
          description,
          kiwify_product_ids: selectedProducts,
          meta_campaign_ids: selectedCampaigns,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: "Projeto atualizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar projeto", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveKiwify = () => {
    if (!kiwifyClientId || !kiwifyClientSecret || !kiwifyAccountId) {
      toast({ title: "Preencha todas as credenciais do Kiwify", variant: "destructive" });
      return;
    }
    saveIntegration.mutate({
      type: 'kiwify',
      credentials: { client_id: kiwifyClientId, client_secret: kiwifyClientSecret, account_id: kiwifyAccountId },
    });
  };

  const handleSaveMeta = () => {
    if (!metaAccessToken || !metaAdAccountId) {
      toast({ title: "Preencha todas as credenciais do Meta Ads", variant: "destructive" });
      return;
    }
    saveIntegration.mutate({
      type: 'meta_ads',
      credentials: { access_token: metaAccessToken, ad_account_id: metaAdAccountId },
    });
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(p => p !== productId)
        : [...prev, productId]
    );
  };

  const toggleCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev =>
      prev.includes(campaignId)
        ? prev.filter(c => c !== campaignId)
        : [...prev, campaignId]
    );
  };

  if (authLoading || projectLoading || integrationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Editar Projeto</h1>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Projeto</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Curso de Marketing Digital"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do projeto..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Kiwify Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Kiwify
                  {kiwifyIntegration ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardTitle>
                <CardDescription>
                  Conecte a conta Kiwify deste projeto para importar vendas
                </CardDescription>
              </div>
              {kiwifyIntegration && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectIntegration.mutate('kiwify')}
                >
                  Desconectar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Client ID</label>
              <Input
                value={kiwifyClientId}
                onChange={(e) => setKiwifyClientId(e.target.value)}
                placeholder="Seu Client ID do Kiwify"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Client Secret</label>
              <div className="relative">
                <Input
                  type={showKiwifySecret ? "text" : "password"}
                  value={kiwifyClientSecret}
                  onChange={(e) => setKiwifyClientSecret(e.target.value)}
                  placeholder="Seu Client Secret do Kiwify"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowKiwifySecret(!showKiwifySecret)}
                >
                  {showKiwifySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Account ID</label>
              <Input
                value={kiwifyAccountId}
                onChange={(e) => setKiwifyAccountId(e.target.value)}
                placeholder="Seu Account ID do Kiwify"
              />
            </div>
            <Button onClick={handleSaveKiwify} disabled={saveIntegration.isPending}>
              {saveIntegration.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Credenciais Kiwify
            </Button>

            {/* Kiwify Products */}
            {kiwifyIntegration && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Produtos para Monitorar</h4>
                {productsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando produtos...
                  </div>
                ) : kiwifyProducts?.length > 0 ? (
                  <div className="space-y-2">
                    {kiwifyProducts.map((product: { id: string; name: string }) => (
                      <div key={product.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        <span>{product.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum produto encontrado</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meta Ads Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Meta Ads
                  {metaIntegration ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardTitle>
                <CardDescription>
                  Conecte a conta Meta Ads deste projeto para importar gastos
                </CardDescription>
              </div>
              {metaIntegration && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectIntegration.mutate('meta_ads')}
                >
                  Desconectar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Access Token</label>
              <div className="relative">
                <Input
                  type={showMetaToken ? "text" : "password"}
                  value={metaAccessToken}
                  onChange={(e) => setMetaAccessToken(e.target.value)}
                  placeholder="Seu Access Token do Meta"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowMetaToken(!showMetaToken)}
                >
                  {showMetaToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Ad Account ID</label>
              <Input
                value={metaAdAccountId}
                onChange={(e) => setMetaAdAccountId(e.target.value)}
                placeholder="Ex: act_123456789"
              />
            </div>
            <Button onClick={handleSaveMeta} disabled={saveIntegration.isPending}>
              {saveIntegration.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Credenciais Meta
            </Button>

            {/* Meta Campaigns */}
            {metaIntegration && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Campanhas para Monitorar</h4>
                {campaignsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando campanhas...
                  </div>
                ) : metaCampaigns?.length > 0 ? (
                  <div className="space-y-2">
                    {metaCampaigns.map((campaign: { id: string; name: string }) => (
                      <div key={campaign.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedCampaigns.includes(campaign.id)}
                          onCheckedChange={() => toggleCampaign(campaign.id)}
                        />
                        <span>{campaign.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma campanha encontrada</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={() => updateProject.mutate()}
            disabled={updateProject.isPending}
          >
            {updateProject.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Projeto
          </Button>
        </div>
      </div>
    </div>
  );
}
