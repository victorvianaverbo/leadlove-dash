import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BarChart3, Loader2, Check, Crown, ArrowLeft } from 'lucide-react';
import { STRIPE_PLANS, PlanKey } from '@/lib/stripe-plans';
import { CheckoutModal } from '@/components/CheckoutModal';

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
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState<string>('');

  const handleSubscribe = async (planKey: PlanKey) => {
    if (!user || !session) {
      navigate(`/auth?plan=${planKey}`);
      return;
    }

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">MetrikaPRO</span>
          </div>
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Escolha seu Plano</h1>
            <p className="text-muted-foreground max-w-xl mx-auto font-light">
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
                  className={`relative p-7 rounded-xl bg-card text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                    isCurrentPlan
                      ? 'border-2 border-success'
                      : plan.popular
                      ? 'border-2 border-primary'
                      : 'border border-border'
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

                  <h3 className="text-xl font-bold mb-1">{planData.name}</h3>
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

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={handleCloseCheckout}
        priceId={selectedPriceId}
        planName={selectedPlanName}
      />
    </div>
  );
}
