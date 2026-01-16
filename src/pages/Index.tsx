import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Target, Zap, Loader2, Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 97,
    projects: '1 projeto',
    features: ['Integração Kiwify', 'Integração Meta Ads', 'Cálculo de ROAS/CPA', 'Dashboard compartilhável', 'Suporte por email'],
    popular: false,
  },
  {
    name: 'Pro',
    price: 197,
    projects: '5 projetos',
    features: ['Integração Kiwify', 'Integração Meta Ads', 'Cálculo de ROAS/CPA', 'Dashboard compartilhável', 'Suporte prioritário'],
    popular: true,
  },
  {
    name: 'Business',
    price: 397,
    projects: '10 projetos',
    features: ['Integração Kiwify', 'Integração Meta Ads', 'Cálculo de ROAS/CPA', 'Dashboard compartilhável', 'Suporte prioritário', 'Relatórios avançados'],
    popular: false,
  },
  {
    name: 'Agência',
    price: 997,
    projects: 'Projetos ilimitados',
    features: ['Integração Kiwify', 'Integração Meta Ads', 'Cálculo de ROAS/CPA', 'Dashboard compartilhável', 'Suporte prioritário', 'Relatórios avançados', 'White-label'],
    popular: false,
  },
];

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">VendasTracker</span>
        </div>
        <Button asChild>
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Dashboard de Vendas para Infoprodutores
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Acompanhe vendas da Kiwify, gastos do Meta Ads e calcule seu ROAS em tempo real.
        </p>
        <Button size="lg" asChild>
          <Link to="/auth">Começar Grátis</Link>
        </Button>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
          <div className="p-6 rounded-xl bg-card border">
            <TrendingUp className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">ROAS em Tempo Real</h3>
            <p className="text-muted-foreground text-sm">Calcule o retorno sobre investimento</p>
          </div>
          <div className="p-6 rounded-xl bg-card border">
            <Target className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Rastreamento UTM</h3>
            <p className="text-muted-foreground text-sm">Saiba de onde vêm suas vendas</p>
          </div>
          <div className="p-6 rounded-xl bg-card border">
            <Zap className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Multi-projetos</h3>
            <p className="text-muted-foreground text-sm">Organize por projeto</p>
          </div>
        </div>

        {/* Pricing Section */}
        <section className="mt-24 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Escolha seu Plano</h2>
          <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
            Comece a rastrear suas vendas e otimizar seus anúncios hoje mesmo
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 rounded-2xl border-2 bg-card text-left transition-all hover:scale-105 ${
                  plan.popular
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Mais Popular
                  </div>
                )}

                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.projects}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold">R$ {plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link to="/auth">Assinar</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
