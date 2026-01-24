import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, BookOpen, Target, ShoppingCart, BarChart3, Info, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { validateProjectName, validateProjectDescription } from "@/lib/validation";
import { SalesIntegrationCard } from "@/components/integrations/SalesIntegrationCard";
import { MetaAdsIntegrationCard } from "@/components/integrations/MetaAdsIntegrationCard";

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Basic info state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Product selections for each integration
  const [kiwifyProducts, setKiwifyProducts] = useState<string[]>([]);
  const [hotmartProducts, setHotmartProducts] = useState<string[]>([]);
  const [guruProducts, setGuruProducts] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  // Benchmark states
  const [benchmarkEngagement, setBenchmarkEngagement] = useState<number>(2.0);
  const [benchmarkCtr, setBenchmarkCtr] = useState<number>(1.0);
  const [benchmarkLpRate, setBenchmarkLpRate] = useState<number>(70.0);
  const [benchmarkCheckoutRate, setBenchmarkCheckoutRate] = useState<number>(5.0);
  
  // ROAS config
  const [useGrossForRoas, setUseGrossForRoas] = useState<boolean>(false);
  const [benchmarkSaleRate, setBenchmarkSaleRate] = useState<number>(2.0);

  // Collapsible states - connected integrations start collapsed
  const [openIntegrations, setOpenIntegrations] = useState<string[]>([]);

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

  const kiwifyIntegration = integrations?.find(i => i.type === 'kiwify');
  const hotmartIntegration = integrations?.find(i => i.type === 'hotmart');
  const guruIntegration = integrations?.find(i => i.type === 'guru');
  const metaIntegration = integrations?.find(i => i.type === 'meta_ads');

  // Load project data into form
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setKiwifyProducts(project.kiwify_product_ids || []);
      setHotmartProducts((project as any).hotmart_product_ids || []);
      setGuruProducts((project as any).guru_product_ids || []);
      setSelectedCampaigns(project.meta_campaign_ids || []);
      // Load benchmarks
      setBenchmarkEngagement((project as any).benchmark_engagement ?? 2.0);
      setBenchmarkCtr((project as any).benchmark_ctr ?? 1.0);
      setBenchmarkLpRate((project as any).benchmark_lp_rate ?? 70.0);
      setBenchmarkCheckoutRate((project as any).benchmark_checkout_rate ?? 5.0);
      setBenchmarkSaleRate((project as any).benchmark_sale_rate ?? 2.0);
      // ROAS config
      setUseGrossForRoas((project as any).use_gross_for_roas ?? false);
    }
  }, [project]);

  // Set initial open state - disconnected integrations open by default
  useEffect(() => {
    if (integrations) {
      const disconnected: string[] = [];
      if (!kiwifyIntegration?.is_active) disconnected.push('kiwify');
      if (!hotmartIntegration?.is_active) disconnected.push('hotmart');
      if (!guruIntegration?.is_active) disconnected.push('guru');
      if (!metaIntegration?.is_active) disconnected.push('meta_ads');
      setOpenIntegrations(disconnected);
    }
  }, [integrations, kiwifyIntegration, hotmartIntegration, guruIntegration, metaIntegration]);

  const toggleIntegration = (type: string) => {
    setOpenIntegrations(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  // Update project mutation
  const updateProject = useMutation({
    mutationFn: async () => {
      const nameValidation = validateProjectName(name);
      if (!nameValidation.valid) {
        throw new Error(nameValidation.error || 'Nome inválido');
      }
      
      const descValidation = validateProjectDescription(description);
      if (!descValidation.valid) {
        throw new Error(descValidation.error || 'Descrição inválida');
      }
      
      const { error } = await supabase
        .from('projects')
        .update({
          name: name.trim(),
          description: description?.trim() || null,
          kiwify_product_ids: kiwifyProducts,
          hotmart_product_ids: hotmartProducts,
          guru_product_ids: guruProducts,
          meta_campaign_ids: selectedCampaigns,
          benchmark_engagement: benchmarkEngagement,
          benchmark_ctr: benchmarkCtr,
          benchmark_lp_rate: benchmarkLpRate,
          benchmark_checkout_rate: benchmarkCheckoutRate,
          benchmark_sale_rate: benchmarkSaleRate,
          use_gross_for_roas: useGrossForRoas,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ 
        title: "Configurações salvas!", 
        description: "Use o botão Atualizar no Dashboard para sincronizar os dados."
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

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
        {/* Header */}
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
              Defina os valores mínimos esperados para cada métrica do funil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Engajamento (%)</label>
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
                <label className="text-sm font-medium">Taxa LP (%)</label>
                <Input
                  type="number"
                  step="1"
                  value={benchmarkLpRate}
                  onChange={(e) => setBenchmarkLpRate(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Padrão: 70%</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Checkout (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={benchmarkCheckoutRate}
                  onChange={(e) => setBenchmarkCheckoutRate(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Padrão: 5%</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Venda/LP (%)</label>
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

        {/* ROAS Config Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Configuração de ROAS
            </CardTitle>
            <CardDescription>
              Configure como o faturamento é calculado para projetos com coprodução.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Usar valor bruto para ROAS</label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Ative se você tem coprodução. Isso faz o ROAS ser calculado com o valor total da venda, não apenas sua parte.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {useGrossForRoas 
                        ? "ROAS calculado com o valor total cobrado do cliente" 
                        : "ROAS calculado com sua parte líquida (após split)"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={useGrossForRoas}
                  onCheckedChange={setUseGrossForRoas}
                />
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="bg-muted/50 border-border">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Precisa de ajuda?</p>
                <p className="text-xs text-muted-foreground">
                  Tutoriais para Kiwify, Hotmart, Guru e Meta Ads
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/documentacao">Ver Tutoriais</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Sales Integrations Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Integrações de Vendas
            </CardTitle>
            <CardDescription>
              Conecte até 3 plataformas de checkout para importar vendas automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SalesIntegrationCard
              type="kiwify"
              projectId={id!}
              integration={kiwifyIntegration}
              selectedProducts={kiwifyProducts}
              onProductsChange={setKiwifyProducts}
              isOpen={openIntegrations.includes('kiwify')}
              onOpenChange={() => toggleIntegration('kiwify')}
            />
            <SalesIntegrationCard
              type="hotmart"
              projectId={id!}
              integration={hotmartIntegration}
              selectedProducts={hotmartProducts}
              onProductsChange={setHotmartProducts}
              isOpen={openIntegrations.includes('hotmart')}
              onOpenChange={() => toggleIntegration('hotmart')}
            />
            <SalesIntegrationCard
              type="guru"
              projectId={id!}
              integration={guruIntegration}
              selectedProducts={guruProducts}
              onProductsChange={setGuruProducts}
              isOpen={openIntegrations.includes('guru')}
              onOpenChange={() => toggleIntegration('guru')}
            />
          </CardContent>
        </Card>

        {/* Meta Ads Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Integração de Tráfego
            </CardTitle>
            <CardDescription>
              Conecte o Meta Ads para importar gastos e métricas de campanhas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetaAdsIntegrationCard
              projectId={id!}
              integration={metaIntegration}
              selectedCampaigns={selectedCampaigns}
              onCampaignsChange={setSelectedCampaigns}
              isOpen={openIntegrations.includes('meta_ads')}
              onOpenChange={() => toggleIntegration('meta_ads')}
            />
          </CardContent>
        </Card>

        {/* Last Sync Info */}
        {project?.last_sync_at && (
          <p className="text-xs text-muted-foreground text-center">
            Última sincronização: {new Date(project.last_sync_at).toLocaleString('pt-BR')}
          </p>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={() => updateProject.mutate()}
            disabled={updateProject.isPending}
          >
            {updateProject.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
