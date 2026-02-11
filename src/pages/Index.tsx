import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { trackEvent } from '@/lib/meta-pixel';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, ScanSearch, Target, Share2, Loader2, Check, ArrowRight, Crown, BrainCircuit, Cpu, ChevronRight, Activity, DollarSign, TrendingUp, ShoppingCart, Calculator, Link2 } from 'lucide-react';
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

  useEffect(() => {
    trackEvent('ViewContent', { content_name: 'Landing Page' });
  }, []);

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
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">MetrikaPRO</span>
          </div>
          <Button asChild size="sm">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-primary py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-[1.1] tracking-tight animate-fade-in">
            O sistema de IA que analisa<br />seu funil enquanto você dorme
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto animate-fade-in font-light leading-relaxed" style={{ animationDelay: '0.1s' }}>
            De "não sei onde está o problema" para "sei exatamente o que fazer" em 5 minutos. 
            A IA escaneia 100% do seu funil, compara com benchmarks do seu nicho e entrega as 3 ações prioritárias para aumentar seu ROAS hoje.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              variant="secondary"
              className="h-14 px-8 text-base font-medium"
              onClick={() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Começar 7 Dias Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="text-primary-foreground/60 text-sm mt-5 animate-fade-in font-light" style={{ animationDelay: '0.25s' }}>
            Sem compromisso • Cancele a qualquer momento
          </p>
          
          {/* Platform Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <span className="text-primary-foreground/60 text-sm font-light">Integra com:</span>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              {['Kiwify', 'Hotmart', 'Guru', 'Eduzz', 'Meta Ads'].map((platform) => (
                <span key={platform} className="px-4 py-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full text-primary-foreground/90 font-normal">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Por que usar o MetrikaPRO?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-light">
              Inteligência artificial trabalhando 24/7 para você tomar decisões melhores
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <ScanSearch className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-3 tracking-tight">Análise Inteligente Diária</h3>
              <p className="text-muted-foreground leading-relaxed font-light">
                Receba todo dia um diagnóstico completo do seu funil. A IA identifica gargalos, compara com benchmarks e sugere ações prioritárias.
              </p>
            </Card>
            
            <Card className="p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-3 tracking-tight">Tudo em Um Só Lugar</h3>
              <p className="text-muted-foreground leading-relaxed font-light">
                Vendas de Kiwify, Hotmart, Guru e Eduzz + gastos do Meta Ads. ROAS e CPA calculados automaticamente em tempo real.
              </p>
            </Card>
            
            <Card className="p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-3 tracking-tight">Para Você ou Sua Agência</h3>
              <p className="text-muted-foreground leading-relaxed font-light">
                Gerencie seu próprio produto ou dezenas de clientes. Dashboards compartilháveis para mostrar resultados profissionalmente.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Section - NEW */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-primary text-sm mb-6">
              <Activity className="h-4 w-4" />
              <span className="font-medium">Dashboard em Tempo Real</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Acompanhe seus resultados minuto a minuto</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-light">
              Chega de esperar relatórios mensais ou calcular ROAS na planilha. Todas as métricas que importam, atualizadas automaticamente.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 tracking-tight">Faturamento</h3>
              <p className="text-muted-foreground text-sm font-light">
                Vendas de todas as plataformas somadas em tempo real
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 tracking-tight">Investimento</h3>
              <p className="text-muted-foreground text-sm font-light">
                Gastos do Meta Ads sincronizados automaticamente
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 tracking-tight">ROAS</h3>
              <p className="text-muted-foreground text-sm font-light">
                Calculado automaticamente: faturamento ÷ investimento
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 tracking-tight">Vendas</h3>
              <p className="text-muted-foreground text-sm font-light">
                Total de vendas por período, com detalhamento por dia
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 tracking-tight">CPA</h3>
              <p className="text-muted-foreground text-sm font-light">
                Custo por aquisição calculado sem planilhas
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 tracking-tight">Dashboard Público</h3>
              <p className="text-muted-foreground text-sm font-light">
                Compartilhe resultados com clientes via link
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How AI Works Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-primary text-sm mb-6">
              <BrainCircuit className="h-4 w-4" />
              <span className="font-medium">Inteligência Artificial</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Como Funciona a IA</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-light">
              Em 3 passos simples, tenha um analista de marketing trabalhando para você
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="relative">
                <Card className="p-8 h-full hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center mb-6 text-lg">
                    1
                  </div>
                  <h3 className="font-semibold text-lg mb-3 tracking-tight">Conecte suas plataformas</h3>
                  <p className="text-muted-foreground text-sm font-light leading-relaxed">
                    Integre Kiwify, Hotmart, Eduzz ou Guru + Meta Ads em minutos. Sem código, sem complicação.
                  </p>
                </Card>
                <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 h-6 w-6" />
              </div>

              <div className="relative">
                <Card className="p-8 h-full hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center mb-6 text-lg">
                    2
                  </div>
                  <h3 className="font-semibold text-lg mb-3 tracking-tight">IA analisa seu funil</h3>
                  <p className="text-muted-foreground text-sm font-light leading-relaxed">
                    Todos os dias, nossa IA processa suas métricas: Engajamento, CTR, Taxa de LP, Checkout e Vendas.
                  </p>
                </Card>
                <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 h-6 w-6" />
              </div>

              <Card className="p-8 h-full hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center mb-6 text-lg">
                  3
                </div>
                <h3 className="font-semibold text-lg mb-3 tracking-tight">Receba ações prioritárias</h3>
                <p className="text-muted-foreground text-sm font-light leading-relaxed">
                  Descubra exatamente onde está o gargalo e o que fazer para melhorar seus resultados.
                </p>
              </Card>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-card border border-border rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-light">
                <strong className="text-foreground font-medium">Economize horas</strong> toda semana com análises automáticas
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-background" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Escolha seu Plano</h2>
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
                <Card
                  key={plan.key}
                  className={`relative p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                    isCurrentPlan
                      ? 'border-2 border-success'
                      : plan.popular
                      ? 'border-2 border-primary'
                      : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-success-foreground text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                      <Crown className="h-3 w-3" />
                      Seu Plano
                    </div>
                  )}
                  {!isCurrentPlan && plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full">
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
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="font-light">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full h-11 font-medium"
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
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg tracking-tight">MetrikaPRO</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <Link to="/documentacao" className="hover:text-foreground transition-colors">Documentação</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Termos de Uso</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
              <a 
                href="https://wa.me/5531991618745" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                📱 Suporte WhatsApp
              </a>
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
