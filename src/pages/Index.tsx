import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Target, Zap, Loader2, Check, ArrowRight, Crown } from 'lucide-react';
import { STRIPE_PLANS, PlanKey } from '@/lib/stripe-plans';
import { toast } from '@/hooks/use-toast';

const plans: { key: PlanKey; projects: string; features: string[]; popular: boolean }[] = [
  {
    key: 'starter',
    projects: '1 projeto',
    features: ['Kiwify, Hotmart, Guru, Eduzz', 'Integração Meta Ads', 'Cálculo de ROAS/CPA', 'Dashboard compartilhável', 'Suporte por email'],
    popular: false,
  },
  {
    key: 'pro',
    projects: '5 projetos',
    features: ['Kiwify, Hotmart, Guru, Eduzz', 'Integração Meta Ads', 'Cálculo de ROAS/CPA', 'Dashboard compartilhável', 'Suporte prioritário'],
    popular: true,
  },
  {
    key: 'business',
    projects: '10 projetos',
    features: ['Kiwify, Hotmart, Guru, Eduzz', 'Integração Meta Ads', 'Cálculo de ROAS/CPA', 'Dashboard compartilhável', 'Suporte prioritário', 'Relatórios avançados'],
    popular: false,
  },
  {
    key: 'agencia',
    projects: 'Projetos ilimitados',
    features: ['Kiwify, Hotmart, Guru, Eduzz', 'Integração Meta Ads', 'Cálculo de ROAS/CPA', 'Dashboard compartilhável', 'Suporte prioritário', 'Relatórios avançados', 'White-label'],
    popular: false,
  },
];

export default function Index() {
  const { user, loading, subscribed, subscriptionTier, session } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSubscribe = async (planKey: PlanKey) => {
    if (!user || !session) {
      // Redirect to auth with plan in URL
      navigate(`/auth?plan=${planKey}`);
      return;
    }

    setCheckoutLoading(planKey);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: STRIPE_PLANS[planKey].priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Erro ao iniciar checkout',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-primary rounded-xl shadow-primary">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">MetrikaPRO</span>
        </div>
        <Button asChild>
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-primary glow-overlay py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in drop-shadow-lg">
            Dashboard de Vendas para<br />Infoprodutores
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto animate-fade-in drop-shadow-sm" style={{ animationDelay: '0.1s' }}>
            Acompanhe vendas de Kiwify, Hotmart, Guru e Eduzz em um só lugar. 
            Integre com Meta Ads e tenha ROAS em tempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 hover:text-primary-dark shadow-xl"
              onClick={() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Começar 7 Dias Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="text-white/70 text-sm mt-4 animate-fade-in" style={{ animationDelay: '0.25s' }}>
            Sem compromisso. Cancele a qualquer momento.
          </p>
          
          {/* Platform Logos */}
          <div className="flex items-center justify-center gap-4 mt-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <span className="text-white/70 text-sm">Integra com:</span>
            <div className="flex gap-3 text-white font-medium text-sm">
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">Kiwify</span>
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">Hotmart</span>
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">Guru</span>
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">Eduzz</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-soft">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que usar o MetrikaPRO?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas poderosas para você tomar decisões baseadas em dados reais
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group">
              <div className="w-16 h-16 bg-primary-soft rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-muted transition-colors">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">ROAS em Tempo Real</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Calcule o retorno sobre investimento automaticamente e saiba exatamente quanto você está lucrando
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group">
              <div className="w-16 h-16 bg-primary-soft rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-muted transition-colors">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Rastreamento UTM</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Identifique de onde vêm suas vendas e otimize seus investimentos em anúncios
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group">
              <div className="w-16 h-16 bg-primary-soft rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-muted transition-colors">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Multi-projetos</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Gerencie vários produtos e clientes em uma única plataforma organizada
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-background" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Escolha seu Plano</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              7 dias grátis em todos os planos. Cancele a qualquer momento.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const planData = STRIPE_PLANS[plan.key];
              const isCurrentPlan = subscribed && subscriptionTier === plan.key;
              const isLoading = checkoutLoading === plan.key;
              
              return (
                <div
                  key={plan.key}
                  className={`relative p-8 rounded-2xl border-2 bg-card text-left transition-all duration-300 hover:-translate-y-2 ${
                    isCurrentPlan
                      ? 'border-success shadow-lg ring-2 ring-success/20'
                      : plan.popular
                      ? 'border-primary shadow-primary-lg scale-105 z-10'
                      : 'border-border hover:border-primary/50 hover:shadow-lg'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-success text-white text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                      <Crown className="h-3 w-3" />
                      Seu Plano
                    </div>
                  )}
                  {!isCurrentPlan && plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-primary text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-primary">
                      Mais Popular
                    </div>
                  )}

                  <h3 className="text-xl font-bold mb-2">{planData.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6">{plan.projects}</p>

                  <div className="mb-2">
                    <span className="text-4xl font-bold">R$ {planData.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-primary font-medium mb-6">7 dias grátis</p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : plan.popular ? 'default' : 'outline'}
                    disabled={isCurrentPlan || isLoading}
                    onClick={() => handleSubscribe(plan.key)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : isCurrentPlan ? (
                      'Plano Atual'
                    ) : subscribed ? (
                      'Mudar Plano'
                    ) : (
                      'Começar Grátis'
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">MetrikaPRO</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/documentacao" className="hover:text-primary transition-colors">Documentação</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Termos de Uso</Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacidade</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 MetrikaPRO. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
