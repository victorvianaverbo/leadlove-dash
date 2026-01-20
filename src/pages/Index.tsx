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
      {/* Floating Header - Glass Effect */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl px-6 py-3 flex items-center justify-between shadow-glass">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight">MetrikaPRO</span>
            </div>
            <Button asChild size="sm" className="rounded-xl shadow-apple">
              <Link to="/auth">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Apple Style with Mesh Gradient */}
      <section className="relative min-h-[100vh] flex items-center bg-gradient-primary glow-overlay overflow-hidden">
        {/* Decorative floating elements */}
        <div className="absolute top-20 left-[10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-[15%] w-80 h-80 bg-purple-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-glow-pulse" />
        
        <div className="container mx-auto px-4 text-center relative z-10 pt-24">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight animate-fade-in text-shadow-soft">
            Sua IA analista de<br />performance 24/7
          </h1>
          <p className="text-lg md:text-xl text-white/85 mb-12 max-w-2xl mx-auto animate-fade-in font-light leading-relaxed" style={{ animationDelay: '0.1s' }}>
            Dashboard com ROAS em tempo real + análises diárias com IA. 
            Conecte suas plataformas, descubra gargalos no funil e receba ações prioritárias para otimizar suas campanhas.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/95 hover:text-primary-dark shadow-apple-lg rounded-2xl h-14 px-8 text-base font-medium transition-all duration-300 hover:scale-[1.02]"
              onClick={() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Começar 7 Dias Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="text-white/60 text-sm mt-5 animate-fade-in font-light" style={{ animationDelay: '0.25s' }}>
            Sem compromisso • Cancele a qualquer momento
          </p>
          
          {/* Platform Logos - Glass Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <span className="text-white/60 text-sm font-light">Integra com:</span>
            <div className="flex flex-wrap justify-center gap-2 text-white font-medium text-sm">
              {['Kiwify', 'Hotmart', 'Guru', 'Eduzz', 'Meta Ads'].map((platform) => (
                <span key={platform} className="px-4 py-2 glass-card-dark rounded-full text-white/90 font-normal">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Glass Cards */}
      <section className="py-28 bg-hero-mesh relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">Por que usar o MetrikaPRO?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-light">
              Inteligência artificial trabalhando 24/7 para você tomar decisões melhores
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="glass-card p-8 rounded-3xl hover:shadow-apple-lg transition-all duration-500 group hover:-translate-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-3 tracking-tight">Análise Inteligente Diária</h3>
              <p className="text-muted-foreground leading-relaxed font-light">
                Receba todo dia um diagnóstico completo do seu funil. A IA identifica gargalos, compara com benchmarks e sugere ações prioritárias.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="glass-card p-8 rounded-3xl hover:shadow-apple-lg transition-all duration-500 group hover:-translate-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <LineChart className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-3 tracking-tight">Tudo em Um Só Lugar</h3>
              <p className="text-muted-foreground leading-relaxed font-light">
                Vendas de Kiwify, Hotmart, Guru e Eduzz + gastos do Meta Ads. ROAS e CPA calculados automaticamente em tempo real.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="glass-card p-8 rounded-3xl hover:shadow-apple-lg transition-all duration-500 group hover:-translate-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-3 tracking-tight">Para Você ou Sua Agência</h3>
              <p className="text-muted-foreground leading-relaxed font-light">
                Gerencie seu próprio produto ou dezenas de clientes. Dashboards compartilháveis para mostrar resultados profissionalmente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How AI Works Section */}
      <section className="py-28 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full text-primary text-sm mb-6 shadow-apple">
              <Brain className="h-4 w-4" />
              <span className="font-medium">Inteligência Artificial</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">Como Funciona a IA</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-light">
              Em 3 passos simples, tenha um analista de marketing trabalhando para você
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="relative group">
                <div className="glass-card p-8 rounded-3xl h-full hover:shadow-apple-lg transition-all duration-500 hover:-translate-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-primary text-white font-bold flex items-center justify-center mb-6 shadow-primary text-lg">
                    1
                  </div>
                  <h3 className="font-semibold text-lg mb-3 tracking-tight">Conecte suas plataformas</h3>
                  <p className="text-muted-foreground text-sm font-light leading-relaxed">
                    Integre Kiwify, Hotmart, Eduzz ou Guru + Meta Ads em minutos. Sem código, sem complicação.
                  </p>
                </div>
                <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-primary/30 h-6 w-6" />
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="glass-card p-8 rounded-3xl h-full hover:shadow-apple-lg transition-all duration-500 hover:-translate-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-primary text-white font-bold flex items-center justify-center mb-6 shadow-primary text-lg">
                    2
                  </div>
                  <h3 className="font-semibold text-lg mb-3 tracking-tight">IA analisa seu funil</h3>
                  <p className="text-muted-foreground text-sm font-light leading-relaxed">
                    Todos os dias, nossa IA processa suas métricas: Engajamento, CTR, Taxa de LP, Checkout e Vendas.
                  </p>
                </div>
                <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-primary/30 h-6 w-6" />
              </div>

              {/* Step 3 */}
              <div className="group">
                <div className="glass-card p-8 rounded-3xl h-full hover:shadow-apple-lg transition-all duration-500 hover:-translate-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-primary text-white font-bold flex items-center justify-center mb-6 shadow-primary text-lg">
                    3
                  </div>
                  <h3 className="font-semibold text-lg mb-3 tracking-tight">Receba ações prioritárias</h3>
                  <p className="text-muted-foreground text-sm font-light leading-relaxed">
                    Descubra exatamente onde está o gargalo e o que fazer para melhorar seus resultados.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 glass-card rounded-2xl shadow-apple">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-light">
                <strong className="text-foreground font-medium">Economize horas</strong> toda semana com análises automáticas
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Glass Cards */}
      <section className="py-28 bg-gradient-soft relative overflow-hidden" id="pricing">
        {/* Decorative elements */}
        <div className="absolute top-20 left-[5%] w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-[5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">Escolha seu Plano</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-light">
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
                  className={`relative transition-all duration-500 hover:-translate-y-3 ${
                    plan.popular ? 'lg:scale-105 lg:z-10' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Gradient border for popular */}
                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute -inset-[2px] bg-gradient-to-br from-primary via-primary-light to-primary rounded-[26px] opacity-80" />
                  )}
                  
                  <div
                    className={`relative h-full p-7 rounded-3xl ${
                      isCurrentPlan
                        ? 'bg-card border-2 border-success shadow-lg ring-2 ring-success/20'
                        : plan.popular
                        ? 'glass-card shadow-apple-lg'
                        : 'glass-card hover:shadow-apple-lg'
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-success text-white text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                        <Crown className="h-3 w-3" />
                        Seu Plano
                      </div>
                    )}
                    {!isCurrentPlan && plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-primary text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-primary">
                        Mais Popular
                      </div>
                    )}

                    <h3 className="text-xl font-bold mb-1 tracking-tight">{planData.name}</h3>
                    <p className="text-muted-foreground text-sm mb-6 font-light">{plan.projects}</p>

                    <div className="mb-2">
                      <span className="text-4xl font-bold tracking-tight">R$ {planData.price}</span>
                      <span className="text-muted-foreground font-light">/mês</span>
                    </div>
                    <p className="text-sm text-primary font-medium mb-6">7 dias grátis</p>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          <span className="font-light">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full rounded-xl h-12 font-medium transition-all duration-300 ${
                        plan.popular && !isCurrentPlan ? 'shadow-primary hover:shadow-primary-lg' : ''
                      }`}
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
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer - Minimal and Elegant */}
      <footer className="border-t border-border/50 py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-xl shadow-primary">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight">MetrikaPRO</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <Link to="/documentacao" className="hover:text-foreground transition-colors duration-300">Documentação</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors duration-300">Termos de Uso</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors duration-300">Privacidade</Link>
            </div>
            <p className="text-sm text-muted-foreground font-light">
              © 2026 MetrikaPRO
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
