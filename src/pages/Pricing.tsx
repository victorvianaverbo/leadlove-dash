import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { BarChart3, Loader2, Check, Crown, ArrowLeft } from 'lucide-react';
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

export default function Pricing() {
  const { user, subscribed, subscriptionTier, session } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null);

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
        <Button variant="outline" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </header>

      {/* Pricing Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Escolha seu Plano</h1>
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
    </div>
  );
}
