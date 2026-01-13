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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, Search } from "lucide-react";

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
  const [campaignSearch, setCampaignSearch] = useState("");

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
  const { data: metaCampaignsData, isLoading: campaignsLoading, refetch: refetchCampaigns, isFetching: campaignsRefetching } = useQuery({
    queryKey: ['meta-campaigns', id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('meta-campaigns', {
        body: { project_id: id }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!metaIntegration,
  });

  const metaCampaigns = metaCampaignsData?.campaigns || [];

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

  // Auto-select all products when loaded
  useEffect(() => {
    if (kiwifyProducts?.length > 0 && selectedProducts.length === 0) {
      setSelectedProducts(kiwifyProducts.map((p: { id: string }) => p.id));
    }
  }, [kiwifyProducts]);

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

  // Sync sales mutation
  const syncSales = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-project-data', {
        body: { project_id: id }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: `Sincronizado! ${data.salesSynced || 0} vendas importadas.` });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao sincronizar", description: error.message, variant: "destructive" });
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

  // Filter campaigns by search
  const filteredCampaigns = metaCampaigns.filter((c: { name: string }) =>
    c.name.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  const selectAllCampaigns = () => {
    const allIds = filteredCampaigns.map((c: { id: string }) => c.id);
    setSelectedCampaigns(prev => [...new Set([...prev, ...allIds])]);
  };

  const clearCampaignSelection = () => {
    setSelectedCampaigns([]);
  };

  const handleRefreshCampaigns = () => {
    refetchCampaigns();
    toast({ title: "Atualizando campanhas..." });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'PAUSED':
        return 'secondary';
      default:
        return 'outline';
    }
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
              <div className="pt-4 border-t space-y-4">
                <div>
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
                
                {/* Sync Button */}
                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => syncSales.mutate()} 
                    disabled={syncSales.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {syncSales.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar Vendas (90 dias)
                  </Button>
                  {project?.last_sync_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Última sincronização: {new Date(project.last_sync_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
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
              <div className="pt-4 border-t space-y-4">
                {/* Header with refresh button */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Campanhas para Monitorar</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshCampaigns}
                    disabled={campaignsRefetching}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${campaignsRefetching ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar campanhas..."
                    value={campaignSearch}
                    onChange={(e) => setCampaignSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Selection info and quick actions */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedCampaigns.length} de {metaCampaigns.length} selecionadas
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllCampaigns}>
                      Selecionar Todas
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearCampaignSelection}>
                      Limpar
                    </Button>
                  </div>
                </div>

                {/* Campaigns list */}
                {campaignsLoading || campaignsRefetching ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando campanhas...
                  </div>
                ) : filteredCampaigns.length > 0 ? (
                  <ScrollArea className="h-64 rounded-md border p-2">
                    <div className="space-y-2">
                      {filteredCampaigns.map((campaign: { id: string; name: string; status: string; had_recent_activity?: boolean }) => (
                        <div 
                          key={campaign.id} 
                          className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedCampaigns.includes(campaign.id)}
                            onCheckedChange={() => toggleCampaign(campaign.id)}
                          />
                          <span className="flex-1 truncate text-sm">{campaign.name}</span>
                          <div className="flex items-center gap-2">
                            {campaign.had_recent_activity && (
                              <Badge variant="outline" className="text-xs">
                                90 dias
                              </Badge>
                            )}
                            <Badge variant={getStatusVariant(campaign.status)} className="text-xs">
                              {campaign.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : metaCampaigns.length > 0 ? (
                  <p className="text-muted-foreground">Nenhuma campanha encontrada com esse termo</p>
                ) : (
                  <p className="text-muted-foreground">Nenhuma campanha encontrada. Verifique as credenciais.</p>
                )}

                {metaCampaignsData?.date_range && (
                  <p className="text-xs text-muted-foreground">
                    Período de atividade: {metaCampaignsData.date_range.since} a {metaCampaignsData.date_range.until}
                  </p>
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
