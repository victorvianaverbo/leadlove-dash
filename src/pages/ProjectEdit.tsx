import { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Package, Megaphone } from 'lucide-react';

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
    enabled: !!user && !!id,
  });

  const { data: integrations } = useQuery({
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

  // Fetch products from Kiwify (via edge function)
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['kiwify-products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('kiwify-products');
      if (error) throw error;
      return data?.products || [];
    },
    enabled: !!integrations?.find(i => i.type === 'kiwify' && i.is_active),
  });

  // Fetch campaigns from Meta (via edge function)
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['meta-campaigns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('meta-campaigns');
      if (error) throw error;
      return data?.campaigns || [];
    },
    enabled: !!integrations?.find(i => i.type === 'meta_ads' && i.is_active),
  });

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setSelectedProducts(project.kiwify_product_ids || []);
      setSelectedCampaigns(project.meta_campaign_ids || []);
    }
  }, [project]);

  const updateProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('projects')
        .update({
          name,
          description: description || null,
          kiwify_product_ids: selectedProducts,
          meta_campaign_ids: selectedCampaigns,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: 'Projeto atualizado!' });
      navigate(`/projects/${id}`);
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

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

  if (loading || !user || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasKiwify = integrations?.find(i => i.type === 'kiwify' && i.is_active);
  const hasMeta = integrations?.find(i => i.type === 'meta_ads' && i.is_active);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Kiwify Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos Kiwify
            </CardTitle>
            <CardDescription>
              Selecione os produtos que pertencem a este projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasKiwify ? (
              <p className="text-sm text-muted-foreground">
                Conecte sua conta Kiwify nas configurações para ver seus produtos.
              </p>
            ) : productsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando produtos...
              </div>
            ) : products?.length > 0 ? (
              <div className="space-y-3">
                {products.map((product: { id: string; name: string }) => (
                  <div key={product.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                    <Label htmlFor={`product-${product.id}`} className="cursor-pointer">
                      {product.name}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
            )}
          </CardContent>
        </Card>

        {/* Meta Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Campanhas Meta Ads
            </CardTitle>
            <CardDescription>
              Selecione as campanhas relacionadas a este projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasMeta ? (
              <p className="text-sm text-muted-foreground">
                Conecte sua conta Meta Ads nas configurações para ver suas campanhas.
              </p>
            ) : campaignsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando campanhas...
              </div>
            ) : campaigns?.length > 0 ? (
              <div className="space-y-3">
                {campaigns.map((campaign: { id: string; name: string }) => (
                  <div key={campaign.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`campaign-${campaign.id}`}
                      checked={selectedCampaigns.includes(campaign.id)}
                      onCheckedChange={() => toggleCampaign(campaign.id)}
                    />
                    <Label htmlFor={`campaign-${campaign.id}`} className="cursor-pointer">
                      {campaign.name}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma campanha encontrada.</p>
            )}
          </CardContent>
        </Card>

        <Button onClick={() => updateProject.mutate()} className="w-full" disabled={updateProject.isPending}>
          {updateProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Projeto
        </Button>
      </main>
    </div>
  );
}
