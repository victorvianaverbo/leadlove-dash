import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { BarChart3, Sparkles, LineChart, Users, Loader2, Check, ArrowRight, Crown, Brain, Zap, ChevronRight } from 'lucide-react';
import { STRIPE_PLANS, PlanKey } from '@/lib/stripe-plans';
import { toast } from '@/hooks/use-toast';

const plans: { key: PlanKey; projects: string; features: string[]; popular: boolean }[] = [
  {
    key: 'starter',
    projects: '1 projeto',
    features: [
      'Relatórios diários com IA',
      'Identificação de gargalos',
      'Kiwify, Hotmart, Guru, Eduzz',
      'Integração Meta Ads',
      'ROAS/CPA automático',
      'Dashboard compartilhável',
    ],
    popular: false,
  },
  {
    key: 'pro',
    projects: '5 projetos',
    features: [
      'Relatórios diários com IA',
      'Identificação de gargalos',
      'Benchmarks personalizados',
      'Kiwify, Hotmart, Guru, Eduzz',
      'Integração Meta Ads',
      'Suporte prioritário',
    ],
    popular: true,
  },
  {
    key: 'business',
    projects: '10 projetos',
    features: [
      'Relatórios diários com IA',
      'Ações prioritárias sugeridas',
      'Benchmarks personalizados',
      'Todas as integrações',
      'Dashboards para clientes',
      'Suporte prioritário',
    ],
    popular: false,
  },
  {
    key: 'agencia',
    projects: 'Projetos ilimitados',
    features: [
      'Relatórios diários com IA',
      'Ações prioritárias sugeridas',
      'Benchmarks personalizados',
      'Todas as integrações',
      'Dashboards white-label',
      'Suporte dedicado',
    ],
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            Powered by AI
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in drop-shadow-lg">
            Sua IA Analista de<br />Performance 24/7
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto animate-fade-in drop-shadow-sm" style={{ animationDelay: '0.1s' }}>
            Conecte suas plataformas e receba análises diárias com IA. 
            Descubra gargalos no funil, ações prioritárias e otimize suas campanhas automaticamente.
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
          <div className="flex flex-wrap items-center justify-center gap-3 mt-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <span className="text-white/70 text-sm">Integra com:</span>
            <div className="flex flex-wrap justify-center gap-2 text-white font-medium text-sm">
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">Kiwify</span>
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">Hotmart</span>
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">Guru</span>
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">Eduzz</span>
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">Meta Ads</span>
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
              Inteligência artificial trabalhando 24/7 para você tomar decisões melhores
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group">
              <div className="w-16 h-16 bg-primary-soft rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-muted transition-colors">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Análise Inteligente Diária</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Receba todo dia um diagnóstico completo do seu funil. A IA identifica gargalos, compara com benchmarks e sugere ações prioritárias.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group">
              <div className="w-16 h-16 bg-primary-soft rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-muted transition-colors">
                <LineChart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Tudo em Um Só Lugar</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Vendas de Kiwify, Hotmart, Guru e Eduzz + gastos do Meta Ads. ROAS e CPA calculados automaticamente em tempo real.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group">
              <div className="w-16 h-16 bg-primary-soft rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-muted transition-colors">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Para Você ou Sua Agência</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Gerencie seu próprio produto ou dezenas de clientes. Dashboards compartilháveis para mostrar resultados profissionalmente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How AI Works Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-soft rounded-full text-primary text-sm mb-4">
              <Brain className="h-4 w-4" />
              Inteligência Artificial
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como Funciona a IA</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Em 3 passos simples, tenha um analista de marketing trabalhando para você
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="relative">
                <div className="p-6 rounded-2xl bg-card border shadow-sm h-full">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary text-white font-bold flex items-center justify-center mb-4">
                    1
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Conecte suas plataformas</h3>
                  <p className="text-muted-foreground text-sm">
                    Integre Kiwify, Hotmart, Eduzz ou Guru + Meta Ads em minutos. Sem código, sem complicação.
                  </p>
                </div>
                <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 h-6 w-6" />
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="p-6 rounded-2xl bg-card border shadow-sm h-full">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary text-white font-bold flex items-center justify-center mb-4">
                    2
                  </div>
                  <h3 className="font-semibold text-lg mb-2">IA analisa seu funil</h3>
                  <p className="text-muted-foreground text-sm">
                    Todos os dias, nossa IA processa suas métricas: Engajamento, CTR, Taxa de LP, Checkout e Vendas.
                  </p>
                </div>
                <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 h-6 w-6" />
              </div>

              {/* Step 3 */}
              <div>
                <div className="p-6 rounded-2xl bg-card border shadow-sm h-full">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary text-white font-bold flex items-center justify-center mb-4">
                    3
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Receba ações prioritárias</h3>
                  <p className="text-muted-foreground text-sm">
                    Descubra exatamente onde está o gargalo e o que fazer para melhorar seus resultados.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-card border rounded-full shadow-sm">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">Economize horas</strong> toda semana com análises automáticas
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-soft" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Escolha seu Plano</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              7 dias grátis em todos os planos. Sua IA analista começa a trabalhar hoje.
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
                  className={`relative p-6 md:p-8 rounded-2xl border-2 bg-card text-left transition-all duration-300 hover:-translate-y-2 ${
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
                    <span className="text-3xl md:text-4xl font-bold">R$ {planData.price}</span>
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
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
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
