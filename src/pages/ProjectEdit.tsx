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
import { ArrowLeft, Save, Loader2, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, Search, BookOpen, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { validateProjectName, validateProjectDescription } from "@/lib/validation";

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
  const [productSearch, setProductSearch] = useState("");
  const [manualProductIds, setManualProductIds] = useState("");

  // Benchmark states
  const [benchmarkEngagement, setBenchmarkEngagement] = useState<number>(2.0);
  const [benchmarkCtr, setBenchmarkCtr] = useState<number>(1.0);
  const [benchmarkLpRate, setBenchmarkLpRate] = useState<number>(70.0);
  const [benchmarkCheckoutRate, setBenchmarkCheckoutRate] = useState<number>(5.0);
  const [benchmarkSaleRate, setBenchmarkSaleRate] = useState<number>(2.0);

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

  // Fetch Kiwify products - com cache para evitar re-fetch desnecessário
  const { data: kiwifyProducts, isLoading: productsLoading, refetch: refetchProducts, isFetching: productsRefetching } = useQuery({
    queryKey: ['kiwify-products', id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('kiwify-products', {
        body: { project_id: id }
      });
      if (error) throw error;
      return data?.products || [];
    },
    enabled: !!kiwifyIntegration,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 10 * 60 * 1000,   // 10 minutos no garbage collector
  });

  // Fetch Meta campaigns - com cache para evitar re-fetch desnecessário
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
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 10 * 60 * 1000,   // 10 minutos no garbage collector
  });

  const metaCampaigns = metaCampaignsData?.campaigns || [];

  // Load project data into form
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setSelectedProducts(project.kiwify_product_ids || []);
      setSelectedCampaigns(project.meta_campaign_ids || []);
      // Load benchmarks
      setBenchmarkEngagement((project as any).benchmark_engagement ?? 2.0);
      setBenchmarkCtr((project as any).benchmark_ctr ?? 1.0);
      setBenchmarkLpRate((project as any).benchmark_lp_rate ?? 70.0);
      setBenchmarkCheckoutRate((project as any).benchmark_checkout_rate ?? 5.0);
      setBenchmarkSaleRate((project as any).benchmark_sale_rate ?? 2.0);
    }
  }, [project]);

  // Load NON-SENSITIVE credentials from integrations to show connection status
  // Sensitive fields (access_token, client_secret) remain empty for security
  useEffect(() => {
    if (integrations) {
      const kiwify = integrations.find(i => i.type === 'kiwify' && i.is_active);
      const meta = integrations.find(i => i.type === 'meta_ads' && i.is_active);
      
      if (kiwify?.credentials) {
        const creds = kiwify.credentials as { client_id?: string; account_id?: string };
        setKiwifyClientId(creds.client_id || "");
        setKiwifyAccountId(creds.account_id || "");
        // client_secret stays empty (sensitive)
      }
      
      if (meta?.credentials) {
        const creds = meta.credentials as { ad_account_id?: string };
        setMetaAdAccountId(creds.ad_account_id || "");
        // access_token stays empty (sensitive)
      }
    }
  }, [integrations]);

  // Filter products by search
  const filteredProducts = kiwifyProducts?.filter((p: { name: string }) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

  const selectAllProducts = () => {
    const allIds = filteredProducts.map((p: { id: string }) => p.id);
    setSelectedProducts(prev => [...new Set([...prev, ...allIds])]);
  };

  const clearProductSelection = () => {
    setSelectedProducts([]);
  };

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

  // Combine selected products with manual IDs
  const getAllProductIds = () => {
    const manualIds = manualProductIds
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);
    return [...new Set([...selectedProducts, ...manualIds])];
  };

  // Update project mutation
  const updateProject = useMutation({
    mutationFn: async () => {
      // Validate inputs before sending to database
      const nameValidation = validateProjectName(name);
      if (!nameValidation.valid) {
        throw new Error(nameValidation.error || 'Nome inválido');
      }
      
      const descValidation = validateProjectDescription(description);
      if (!descValidation.valid) {
        throw new Error(descValidation.error || 'Descrição inválida');
      }
      
      const allProductIds = getAllProductIds();
      const { error } = await supabase
        .from('projects')
        .update({
          name: name.trim(),
          description: description?.trim() || null,
          kiwify_product_ids: allProductIds,
          meta_campaign_ids: selectedCampaigns,
          benchmark_engagement: benchmarkEngagement,
          benchmark_ctr: benchmarkCtr,
          benchmark_lp_rate: benchmarkLpRate,
          benchmark_checkout_rate: benchmarkCheckoutRate,
          benchmark_sale_rate: benchmarkSaleRate,
        } as any)
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
    // If integration exists, only require the secret to be re-entered
    if (kiwifyIntegration) {
      if (!kiwifyClientSecret) {
        toast({ title: "Digite o Client Secret para atualizar", variant: "destructive" });
        return;
      }
      const currentCreds = kiwifyIntegration.credentials as { client_id?: string; account_id?: string };
      saveIntegration.mutate({
        type: 'kiwify',
        credentials: { 
          client_id: kiwifyClientId || currentCreds.client_id, 
          client_secret: kiwifyClientSecret, 
          account_id: kiwifyAccountId || currentCreds.account_id 
        },
      });
    } else {
      if (!kiwifyClientId || !kiwifyClientSecret || !kiwifyAccountId) {
        toast({ title: "Preencha todas as credenciais do Kiwify", variant: "destructive" });
        return;
      }
      saveIntegration.mutate({
        type: 'kiwify',
        credentials: { client_id: kiwifyClientId, client_secret: kiwifyClientSecret, account_id: kiwifyAccountId },
      });
    }
  };

  const handleSaveMeta = () => {
    // If integration exists, only require the token to be re-entered
    if (metaIntegration) {
      if (!metaAccessToken) {
        toast({ title: "Digite o Access Token para atualizar", variant: "destructive" });
        return;
      }
      const currentCreds = metaIntegration.credentials as { ad_account_id?: string };
      saveIntegration.mutate({
        type: 'meta_ads',
        credentials: { 
          access_token: metaAccessToken, 
          ad_account_id: metaAdAccountId || currentCreds.ad_account_id 
        },
      });
    } else {
      if (!metaAccessToken || !metaAdAccountId) {
        toast({ title: "Preencha todas as credenciais do Meta Ads", variant: "destructive" });
        return;
      }
      saveIntegration.mutate({
        type: 'meta_ads',
        credentials: { access_token: metaAccessToken, ad_account_id: metaAdAccountId },
      });
    }
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
          <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
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

        {/* Benchmarks Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Benchmarks de Funil
            </CardTitle>
            <CardDescription>
              Defina os valores mínimos esperados para cada métrica do funil. O relatório diário usará esses valores como referência.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tx. Engajamento (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={benchmarkEngagement}
                  onChange={(e) => setBenchmarkEngagement(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Padrão: 2%</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CTR Link (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={benchmarkCtr}
                  onChange={(e) => setBenchmarkCtr(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Padrão: 1%</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Taxa LP/Clique (%)</label>
                <Input
                  type="number"
                  step="1"
                  value={benchmarkLpRate}
                  onChange={(e) => setBenchmarkLpRate(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Padrão: 70%</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tx. Checkout (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={benchmarkCheckoutRate}
                  onChange={(e) => setBenchmarkCheckoutRate(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Padrão: 5%</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Taxa Venda/LP (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={benchmarkSaleRate}
                  onChange={(e) => setBenchmarkSaleRate(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Padrão: 2%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Card - Link to Documentation */}
        <Card className="bg-primary-soft border-primary/20">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Precisa de ajuda com as integrações?</p>
                <p className="text-xs text-muted-foreground">
                  Veja nossos tutoriais passo a passo para Kiwify, Hotmart, Guru e Eduzz
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/documentacao">Ver Tutoriais</Link>
            </Button>
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
            {kiwifyIntegration && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-300">
                ✓ Credenciais salvas com segurança. Para atualizar, preencha os campos abaixo.
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Client ID</label>
              <Input
                value={kiwifyClientId}
                onChange={(e) => setKiwifyClientId(e.target.value)}
                placeholder="Seu Client ID do Kiwify"
                className={kiwifyIntegration && kiwifyClientId ? "bg-muted/30" : ""}
              />
              {kiwifyIntegration && kiwifyClientId && (
                <p className="text-xs text-muted-foreground mt-1">ID configurado</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Client Secret</label>
              <div className="relative">
                <Input
                  type={showKiwifySecret ? "text" : "password"}
                  value={kiwifyClientSecret}
                  onChange={(e) => setKiwifyClientSecret(e.target.value)}
                  placeholder={kiwifyIntegration ? "••••••••••••" : "Seu Client Secret do Kiwify"}
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
              {kiwifyIntegration && (
                <p className="text-xs text-muted-foreground mt-1">Oculto por segurança. Digite novamente para atualizar.</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Account ID</label>
              <Input
                value={kiwifyAccountId}
                onChange={(e) => setKiwifyAccountId(e.target.value)}
                placeholder="Seu Account ID do Kiwify"
                className={kiwifyIntegration && kiwifyAccountId ? "bg-muted/30" : ""}
              />
              {kiwifyIntegration && kiwifyAccountId && (
                <p className="text-xs text-muted-foreground mt-1">ID configurado</p>
              )}
            </div>
            <Button onClick={handleSaveKiwify} disabled={saveIntegration.isPending}>
              {saveIntegration.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {kiwifyIntegration ? "Atualizar Credenciais Kiwify" : "Salvar Credenciais Kiwify"}
            </Button>

            {/* Kiwify Products */}
            {kiwifyIntegration && (
              <div className="pt-4 border-t space-y-4">
                {/* Header with refresh button */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Produtos para Monitorar</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refetchProducts();
                      toast({ title: "Atualizando produtos..." });
                    }}
                    disabled={productsRefetching}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${productsRefetching ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Selection info and quick actions */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedProducts.length} de {kiwifyProducts?.length || 0} selecionados
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllProducts}>
                      Selecionar Todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearProductSelection}>
                      Limpar
                    </Button>
                  </div>
                </div>

                {/* Products list */}
                {productsLoading || productsRefetching ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando produtos...
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <ScrollArea className="h-48 rounded-md border p-2">
                    <div className="space-y-2">
                      {filteredProducts.map((product: { id: string; name: string }) => (
                        <div 
                          key={product.id} 
                          className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProduct(product.id)}
                          />
                          <span className="flex-1 truncate text-sm">{product.name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : kiwifyProducts?.length > 0 ? (
                  <p className="text-muted-foreground">Nenhum produto encontrado com esse termo</p>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum produto encontrado na API.</p>
                )}
                
                {/* Manual Product IDs */}
                <div className="pt-4 border-t space-y-2">
                  <h4 className="font-medium text-sm">Adicionar Produtos Manualmente</h4>
                  <p className="text-xs text-muted-foreground">
                    Se seus produtos não aparecem na lista acima, cole os IDs separados por vírgula. 
                    Encontre o ID na URL ao editar um produto no painel Kiwify.
                  </p>
                  <Input
                    placeholder="Ex: abc123, def456, ghi789"
                    value={manualProductIds}
                    onChange={(e) => setManualProductIds(e.target.value)}
                  />
                  {manualProductIds && (
                    <p className="text-xs text-muted-foreground">
                      {manualProductIds.split(',').filter(id => id.trim()).length} ID(s) manual(is) adicionado(s)
                    </p>
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
            {metaIntegration && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-300">
                ✓ Credenciais salvas com segurança. Para atualizar, preencha os campos abaixo.
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Access Token</label>
              <div className="relative">
                <Input
                  type={showMetaToken ? "text" : "password"}
                  value={metaAccessToken}
                  onChange={(e) => setMetaAccessToken(e.target.value)}
                  placeholder={metaIntegration ? "••••••••••••" : "Seu Access Token do Meta"}
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
              {metaIntegration && (
                <p className="text-xs text-muted-foreground mt-1">Oculto por segurança. Digite novamente para atualizar.</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Ad Account ID</label>
              <Input
                value={metaAdAccountId}
                onChange={(e) => setMetaAdAccountId(e.target.value)}
                placeholder="Ex: act_123456789"
                className={metaIntegration && metaAdAccountId ? "bg-muted/30" : ""}
              />
              {metaIntegration && metaAdAccountId && (
                <p className="text-xs text-muted-foreground mt-1">ID configurado</p>
              )}
            </div>
            <Button onClick={handleSaveMeta} disabled={saveIntegration.isPending}>
              {saveIntegration.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {metaIntegration ? "Atualizar Credenciais Meta" : "Salvar Credenciais Meta"}
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
