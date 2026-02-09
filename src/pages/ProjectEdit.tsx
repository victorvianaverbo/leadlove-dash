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
import { TrackingScriptCard } from "@/components/tracking/TrackingScriptCard";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { validateProjectName, validateProjectDescription } from "@/lib/validation";
import { SalesIntegrationCard } from "@/components/integrations/SalesIntegrationCard";
import { MetaAdsIntegrationCard } from "@/components/integrations/MetaAdsIntegrationCard";
import { isUUID } from "@/lib/utils";

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
  const [eduzzProducts, setEduzzProducts] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  // Benchmark states
  const [benchmarkEngagement, setBenchmarkEngagement] = useState<number>(2.0);
  const [benchmarkCtr, setBenchmarkCtr] = useState<number>(1.0);
  const [benchmarkLpRate, setBenchmarkLpRate] = useState<number>(70.0);
  const [benchmarkCheckoutRate, setBenchmarkCheckoutRate] = useState<number>(5.0);
  
  // ROAS config
  const [useGrossForRoas, setUseGrossForRoas] = useState<boolean>(false);
  const [benchmarkSaleRate, setBenchmarkSaleRate] = useState<number>(2.0);
  
  // Kiwify ticket price (fixed product price)
  const [kiwifyTicketPrice, setKiwifyTicketPrice] = useState<string>("");

  // Collapsible states - connected integrations start collapsed
  const [openIntegrations, setOpenIntegrations] = useState<string[]>([]);

  // Fetch project data - supports both UUID and slug lookup
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      let query = supabase.from('projects').select('*');
      
      if (isUUID(id!)) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id).eq('user_id', user!.id);
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Use real project ID for queries that need it
  const projectId = project?.id;

  // Fetch project integrations
  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['project-integrations', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('project_id', projectId!);
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !!user,
  });

  const kiwifyIntegration = integrations?.find(i => i.type === 'kiwify');
  const hotmartIntegration = integrations?.find(i => i.type === 'hotmart');
  const guruIntegration = integrations?.find(i => i.type === 'guru');
  const eduzzIntegration = integrations?.find(i => i.type === 'eduzz');
  const metaIntegration = integrations?.find(i => i.type === 'meta_ads');

  // Load project data into form
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setKiwifyProducts(project.kiwify_product_ids || []);
      setHotmartProducts((project as any).hotmart_product_ids || []);
      setGuruProducts((project as any).guru_product_ids || []);
      setEduzzProducts((project as any).eduzz_product_ids || []);
      setSelectedCampaigns(project.meta_campaign_ids || []);
      // Load benchmarks
      setBenchmarkEngagement((project as any).benchmark_engagement ?? 2.0);
      setBenchmarkCtr((project as any).benchmark_ctr ?? 1.0);
      setBenchmarkLpRate((project as any).benchmark_lp_rate ?? 70.0);
      setBenchmarkCheckoutRate((project as any).benchmark_checkout_rate ?? 5.0);
      setBenchmarkSaleRate((project as any).benchmark_sale_rate ?? 2.0);
      // ROAS config
      setUseGrossForRoas((project as any).use_gross_for_roas ?? false);
      // Kiwify ticket price
      setKiwifyTicketPrice((project as any).kiwify_ticket_price ? String((project as any).kiwify_ticket_price) : "");
    }
  }, [project]);


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
          eduzz_product_ids: eduzzProducts,
          meta_campaign_ids: selectedCampaigns,
          benchmark_engagement: benchmarkEngagement,
          benchmark_ctr: benchmarkCtr,
          benchmark_lp_rate: benchmarkLpRate,
          benchmark_checkout_rate: benchmarkCheckoutRate,
          benchmark_sale_rate: benchmarkSaleRate,
          use_gross_for_roas: useGrossForRoas,
          kiwify_ticket_price: kiwifyTicketPrice ? parseFloat(kiwifyTicketPrice) : null,
        } as any)
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ 
        title: "Configurações salvas!", 
        description: "Sincronizando dados do projeto..."
      });
      navigate(`/projects/${project?.slug || id}?sync=true`);
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
          <Button variant="ghost" onClick={() => navigate(`/projects/${project?.slug || id}`)}>
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


        {/* ROAS Config Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Configuração de Faturamento
            </CardTitle>
            <CardDescription>
              Configure o valor do ticket para cálculo correto do faturamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Kiwify Ticket Price */}
            <TooltipProvider>
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium">Preço do Ticket (Kiwify)</label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Valor fixo do produto Kiwify. Será usado como faturamento para cada venda.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 22.08"
                    value={kiwifyTicketPrice}
                    onChange={(e) => setKiwifyTicketPrice(e.target.value)}
                    className="max-w-[150px]"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {kiwifyTicketPrice 
                    ? `Cada venda será registrada com R$ ${parseFloat(kiwifyTicketPrice).toFixed(2)}.`
                    : "Deixe vazio para usar o valor da API."}
                </p>
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
              projectId={projectId!}
              integration={kiwifyIntegration}
              selectedProducts={kiwifyProducts}
              onProductsChange={setKiwifyProducts}
              isOpen={openIntegrations.includes('kiwify')}
              onOpenChange={() => toggleIntegration('kiwify')}
            />
            <SalesIntegrationCard
              type="hotmart"
              projectId={projectId!}
              integration={hotmartIntegration}
              selectedProducts={hotmartProducts}
              onProductsChange={setHotmartProducts}
              isOpen={openIntegrations.includes('hotmart')}
              onOpenChange={() => toggleIntegration('hotmart')}
            />
            <SalesIntegrationCard
              type="guru"
              projectId={projectId!}
              integration={guruIntegration}
              selectedProducts={guruProducts}
              onProductsChange={setGuruProducts}
              isOpen={openIntegrations.includes('guru')}
              onOpenChange={() => toggleIntegration('guru')}
            />
            <SalesIntegrationCard
              type="eduzz"
              projectId={projectId!}
              integration={eduzzIntegration}
              selectedProducts={eduzzProducts}
              onProductsChange={setEduzzProducts}
              isOpen={openIntegrations.includes('eduzz')}
              onOpenChange={() => toggleIntegration('eduzz')}
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
              projectId={projectId!}
              integration={metaIntegration}
              selectedCampaigns={selectedCampaigns}
              onCampaignsChange={setSelectedCampaigns}
              isOpen={openIntegrations.includes('meta_ads')}
              onOpenChange={() => toggleIntegration('meta_ads')}
            />
          </CardContent>
        </Card>

        {/* Tracking Script */}
        <TrackingScriptCard />

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
