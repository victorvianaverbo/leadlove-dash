import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, AlertTriangle, Crown } from 'lucide-react';
import { STRIPE_PLANS, PlanKey } from '@/lib/stripe-plans';
import { CheckoutModal } from '@/components/CheckoutModal';
import { validateProjectName, validateProjectDescription } from '@/lib/validation';
import { generateSlug } from '@/lib/utils';

// List of upgrade options for the modal
const upgradeOptions: { key: PlanKey; label: string }[] = [
  { key: 'pro', label: 'Pro - 5 projetos' },
  { key: 'business', label: 'Business - 10 projetos' },
  { key: 'agencia', label: 'Agência - Ilimitado' },
];

export default function ProjectNew() {
  const { user, loading, subscribed, subscriptionTier, subscriptionLoading, extraProjects } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch current project count
  const { data: projectCount = 0, isLoading: countLoading } = useQuery({
    queryKey: ['project-count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const currentPlan = subscriptionTier ? STRIPE_PLANS[subscriptionTier] : null;
  const baseProjectLimit = currentPlan?.projects ?? 0;
  // -1 means unlimited, otherwise add extra projects from admin override
  const projectLimit = baseProjectLimit === -1 ? -1 : baseProjectLimit + extraProjects;
  const canCreateProject = subscribed && (projectLimit === -1 || projectCount < projectLimit);
  const isAtLimit = subscribed && projectLimit !== -1 && projectCount >= projectLimit;

  // Filter upgrade options to only show plans with more projects than current
  const availableUpgrades = upgradeOptions.filter((option) => {
    const optionPlan = STRIPE_PLANS[option.key];
    if (optionPlan.projects === -1) return true; // unlimited always available
    if (!currentPlan) return true;
    if (currentPlan.projects === -1) return false; // already unlimited
    return optionPlan.projects > currentPlan.projects;
  });

  // Generate unique slug for the user
  const generateUniqueSlug = async (name: string, userId: string): Promise<string> => {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId)
        .eq('slug', slug)
        .maybeSingle();
      
      if (!data) break; // Slug available
      
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
    
    return slug;
  };

  const createProject = useMutation({
    mutationFn: async () => {
      if (!canCreateProject) {
        throw new Error('Limite de projetos atingido');
      }
      
      // Generate unique slug for URL
      const slug = await generateUniqueSlug(name, user!.id);
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user!.id,
          name,
          description: description || null,
          slug,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-count'] });
      toast({ title: 'Projeto criado!', description: 'Agora selecione os produtos e campanhas.' });
      // Navigate using slug for friendly URL
      navigate(`/projects/${data.slug}/edit`);
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar projeto', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name
    const nameValidation = validateProjectName(name);
    if (!nameValidation.valid) {
      toast({ title: 'Erro de validação', description: nameValidation.error, variant: 'destructive' });
      return;
    }
    
    // Validate description
    const descValidation = validateProjectDescription(description);
    if (!descValidation.valid) {
      toast({ title: 'Erro de validação', description: descValidation.error, variant: 'destructive' });
      return;
    }
    
    if (!canCreateProject) {
      toast({ title: 'Limite de projetos atingido', description: 'Faça upgrade para criar mais projetos.', variant: 'destructive' });
      return;
    }
    createProject.mutate();
  };

  const handleUpgrade = (planKey: PlanKey) => {
    const plan = STRIPE_PLANS[planKey];
    setSelectedPriceId(plan.priceId);
    setSelectedPlanName(plan.name);
    setShowCheckoutModal(true);
  };

  const handleCloseCheckout = () => {
    setShowCheckoutModal(false);
    setSelectedPriceId(null);
    setSelectedPlanName('');
  };

  if (loading || !user || subscriptionLoading || countLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not subscribed - show upgrade prompt with checkout modal
  if (!subscribed) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-xl">
          <Card>
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Assinatura Necessária</h2>
              <p className="text-muted-foreground mb-6">
                Você precisa de uma assinatura ativa para criar projetos.
              </p>
              <div className="space-y-3">
                {upgradeOptions.map((option) => (
                  <Button
                    key={option.key}
                    className="w-full"
                    variant={option.key === 'pro' ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(option.key)}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {option.label} - R$ {STRIPE_PLANS[option.key].price}/mês
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={handleCloseCheckout}
          priceId={selectedPriceId}
          planName={selectedPlanName}
        />
      </div>
    );
  }

  // At project limit - show upgrade prompt with checkout modal
  if (isAtLimit) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-xl">
          <Card className="border-warning/20">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
              <h2 className="text-xl font-bold mb-2">Limite de Projetos Atingido</h2>
              <p className="text-muted-foreground mb-2">
                Você está usando <strong>{projectCount} de {projectLimit}</strong> projetos do plano <strong>{currentPlan?.name}</strong>.
              </p>
              <p className="text-muted-foreground mb-6">
                Faça upgrade para um plano maior e tenha mais projetos.
              </p>
              <div className="space-y-3">
                {availableUpgrades.length > 0 ? (
                  availableUpgrades.map((option) => (
                    <Button
                      key={option.key}
                      className="w-full"
                      variant={option.key === 'pro' || (option.key === 'business' && subscriptionTier === 'pro') ? 'default' : 'outline'}
                      onClick={() => handleUpgrade(option.key)}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {option.label} - R$ {STRIPE_PLANS[option.key].price}/mês
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Você já está no plano máximo. Entre em contato para opções personalizadas.
                  </p>
                )}
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/dashboard">Voltar ao Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={handleCloseCheckout}
          priceId={selectedPriceId}
          planName={selectedPlanName}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-xl">
        {/* Project count info */}
        {projectLimit !== -1 && (
          <div className="mb-4 p-3 rounded-xl bg-muted text-sm text-muted-foreground text-center border border-border">
            Você está usando <strong className="text-foreground">{projectCount} de {projectLimit}</strong> projetos do plano <strong className="text-foreground">{currentPlan?.name}</strong>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="tracking-tight">Novo Projeto</CardTitle>
            <CardDescription>
              Crie um projeto para agrupar produtos e campanhas relacionados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do projeto *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Lançamento Curso X"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo deste projeto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createProject.isPending}>
                {createProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar e Continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
