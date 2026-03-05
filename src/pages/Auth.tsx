import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BarChart3, ExternalLink, RefreshCw, Check, Shield } from 'lucide-react';
import { STRIPE_PLANS, PlanKey } from '@/lib/stripe-plans';

const planFeatures: Record<string, string[]> = {
  starter: [
    'Relatórios diários com IA',
    'Identificação de gargalos',
    'Kiwify, Hotmart, Guru, Eduzz',
    'Integração Meta Ads',
    'ROAS/CPA automático',
    '1 projeto',
  ],
  pro: [
    'Tudo do Starter',
    '5 projetos',
    'Benchmarks personalizados',
    'Suporte prioritário',
  ],
  business: [
    'Tudo do Pro',
    '10 projetos',
    'Ações prioritárias sugeridas',
    'Dashboards para clientes',
  ],
  agencia: [
    'Tudo do Business',
    'Projetos ilimitados',
    'Dashboards white-label',
    'Suporte dedicado',
  ],
};

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutRedirecting, setIsCheckoutRedirecting] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const { signIn, signUp, user, loading, session, subscribed, subscriptionLoading, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const selectedPlan = searchParams.get('plan') as PlanKey | null;
  const validPlan = selectedPlan && STRIPE_PLANS[selectedPlan] ? selectedPlan : null;

  useEffect(() => {
    const handleAuthenticatedUser = async () => {
      if (loading || subscriptionLoading) return;
      if (!user || !session) return;
      if (awaitingPayment) return;

      if (subscribed) {
        if (validPlan) {
          setIsCheckoutRedirecting(true);
          try {
            const { data, error } = await supabase.functions.invoke('customer-portal');
            if (error) throw error;
            if (data?.url) {
              window.open(data.url, '_blank');
              toast({ title: 'Portal aberto em nova aba', description: 'Gerencie seu plano na nova aba.' });
              setIsCheckoutRedirecting(false);
              navigate('/dashboard');
              return;
            }
          } catch (error) {
            console.error('Portal error:', error);
            toast({ title: 'Você já tem um plano ativo', description: 'Use o portal de assinatura para gerenciar seu plano.' });
          }
          setIsCheckoutRedirecting(false);
        }
        navigate('/dashboard');
        return;
      }

      if (validPlan && !isCheckoutRedirecting) {
        setIsCheckoutRedirecting(true);
        try {
          const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: { priceId: STRIPE_PLANS[validPlan].priceId },
          });
          if (error) throw error;
          if (data?.url) {
            window.open(data.url, '_blank');
            setAwaitingPayment(true);
            setIsCheckoutRedirecting(false);
            return;
          }
        } catch (error) {
          console.error('Checkout error:', error);
          toast({ title: 'Erro ao iniciar checkout', description: 'Redirecionando para o dashboard...', variant: 'destructive' });
          navigate('/dashboard');
        }
        setIsCheckoutRedirecting(false);
      } else if (!validPlan) {
        navigate('/dashboard');
      }
    };

    handleAuthenticatedUser();
  }, [user, loading, subscriptionLoading, session, validPlan, subscribed, navigate, toast, isCheckoutRedirecting, awaitingPayment]);

  useEffect(() => {
    if (!awaitingPayment || !session?.access_token) return;
    const interval = setInterval(async () => {
      await checkSubscription();
    }, 5000);
    return () => clearInterval(interval);
  }, [awaitingPayment, session?.access_token, checkSubscription]);

  useEffect(() => {
    if (awaitingPayment && subscribed) {
      toast({ title: 'Pagamento confirmado! 🎉', description: 'Seu plano foi ativado com sucesso.' });
      navigate('/dashboard');
    }
  }, [awaitingPayment, subscribed, navigate, toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (password.length < 6) {
      toast({ title: 'Senha muito curta', description: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    const { error } = await signUp(email, password, fullName);
    if (error) {
      if (error.message.includes('already registered')) {
        toast({ title: 'Email já cadastrado', description: 'Este email já está em uso. Tente fazer login.', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao criar conta', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Conta criada!', description: 'Você será redirecionado automaticamente.' });
    }
    setIsLoading(false);
  };

  const handleCheckPayment = async () => {
    await checkSubscription();
    if (!subscribed) {
      toast({ title: 'Pagamento não detectado', description: 'Complete o pagamento na aba do Stripe.' });
    }
  };

  // ── Loading / checkout redirecting ───────────────────────────────────
  if (loading || isCheckoutRedirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] gap-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#2563eb] rounded-xl">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">MetrikaPRO</span>
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
        {isCheckoutRedirecting && (
          <p className="text-slate-400 text-sm">Preparando checkout...</p>
        )}
      </div>
    );
  }

  // ── Awaiting payment ─────────────────────────────────────────────────
  if (awaitingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
        <div className="w-full max-w-md bg-[#1e293b] border border-[#334155] rounded-2xl p-8 text-center shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-[#2563eb]/20 rounded-2xl border border-[#2563eb]/30">
              <ExternalLink className="h-10 w-10 text-[#2563eb]" />
            </div>
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">Complete o pagamento</h2>
          <p className="text-slate-400 mb-8">
            Uma nova aba foi aberta para você finalizar o pagamento no Stripe.
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Aguardando confirmação automática...</span>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleCheckPayment}
              className="w-full h-11 bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Já finalizei o pagamento
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setAwaitingPayment(false); navigate('/dashboard'); }}
              className="w-full text-slate-400 hover:text-slate-200 hover:bg-white/5"
            >
              Continuar sem assinar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────
  const features = validPlan ? planFeatures[validPlan] : null;
  const planData = validPlan ? STRIPE_PLANS[validPlan] : null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── LEFT PANEL ── */}
      <div className="hidden md:flex md:w-1/2 bg-[#0f172a] flex-col justify-between p-10 xl:p-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#2563eb] rounded-xl">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">MetrikaPRO</span>
        </div>

        {/* Middle content */}
        <div className="space-y-8">
          {planData ? (
            <>
              <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">Plano selecionado</span>
                    <h2 className="text-white text-2xl font-bold mt-1">{planData.name}</h2>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30">
                    7 dias grátis
                  </span>
                </div>
                <div>
                  <span className="text-[#2563eb] text-3xl font-bold">R$ {planData.price}</span>
                  <span className="text-slate-400 text-sm">/mês após o trial</span>
                </div>
              </div>

              <ul className="space-y-3">
                {features?.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#2563eb]/20 border border-[#2563eb]/40 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-[#2563eb]" />
                    </div>
                    <span className="text-slate-300 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-white text-3xl font-bold leading-tight mb-3">
                  O analista de marketing que trabalha{' '}
                  <span className="text-[#2563eb]">enquanto você dorme</span>
                </h2>
                <p className="text-slate-400 text-base leading-relaxed">
                  IA que escaneia 100% do seu funil, compara com benchmarks e entrega as 3 ações prioritárias para aumentar seu ROAS.
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  'Relatórios diários com IA',
                  'Identificação de gargalos automática',
                  'Benchmarks do seu nicho',
                  'ROAS e CPA em tempo real',
                  'Kiwify, Hotmart, Guru, Eduzz + Meta Ads',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#2563eb]/20 border border-[#2563eb]/40 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-[#2563eb]" />
                    </div>
                    <span className="text-slate-300 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Footer trust */}
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Shield className="h-4 w-4" />
          <span>Sem cartão de crédito para o trial · Cancele a qualquer momento</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-background p-6 md:p-10">
        <div className="w-full max-w-sm">

          {/* Mobile-only logo */}
          <div className="flex md:hidden items-center justify-center gap-3 mb-8">
            <div className="p-2 bg-primary rounded-xl">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">MetrikaPRO</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              {validPlan ? 'Criar sua conta' : 'Bem-vindo de volta'}
            </h1>
            {validPlan && planData ? (
              <p className="text-muted-foreground text-sm">
                Plano <span className="font-semibold text-primary">{planData.name}</span> · 7 dias grátis, depois R$ {planData.price}/mês
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">Entre ou crie sua conta para continuar</p>
            )}
          </div>

          {/* Google Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 mb-4 flex items-center justify-center gap-3 font-medium"
            onClick={async () => {
              setIsLoading(true);
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/dashboard` },
              });
              if (error) {
                toast({ title: 'Erro ao entrar com Google', description: error.message, variant: 'destructive' });
              }
              setIsLoading(false);
            }}
            disabled={isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continuar com Google'}
          </Button>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="font-medium">Entrar</TabsTrigger>
              <TabsTrigger value="signup" className="font-medium">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input id="signin-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
                </div>
                <div className="flex justify-end">
                  <Button variant="link" asChild className="px-0 h-auto text-sm text-muted-foreground hover:text-primary">
                    <Link to="/forgot-password">Esqueci minha senha</Link>
                  </Button>
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome completo</Label>
                  <Input id="signup-name" type="text" placeholder="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11" />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Mobile trust badge */}
          <p className="md:hidden mt-6 text-center text-xs text-muted-foreground">
            Sem cartão de crédito para o trial · Cancele a qualquer momento
          </p>
        </div>
      </div>
    </div>
  );
}
