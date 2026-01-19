import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BarChart3, ExternalLink, RefreshCw } from 'lucide-react';
import { STRIPE_PLANS, PlanKey } from '@/lib/stripe-plans';

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

  // Handle authenticated user - checkout or portal redirect
  useEffect(() => {
    const handleAuthenticatedUser = async () => {
      // Wait for loading states
      if (loading || subscriptionLoading) return;
      
      // Not logged in - show form
      if (!user || !session) return;

      // If awaiting payment, don't redirect
      if (awaitingPayment) return;

      // User already has active subscription
      if (subscribed) {
        if (validPlan) {
          // User tried to select a plan but already subscribed - redirect to portal
          setIsCheckoutRedirecting(true);
          try {
            const { data, error } = await supabase.functions.invoke('customer-portal');
            if (error) throw error;
            if (data?.url) {
              window.open(data.url, '_blank');
              toast({
                title: 'Portal aberto em nova aba',
                description: 'Gerencie seu plano na nova aba.',
              });
              setIsCheckoutRedirecting(false);
              navigate('/dashboard');
              return;
            }
          } catch (error) {
            console.error('Portal error:', error);
            toast({
              title: 'Você já tem um plano ativo',
              description: 'Use o portal de assinatura para gerenciar seu plano.',
            });
          }
          setIsCheckoutRedirecting(false);
        }
        // Already subscribed without plan selection - go to dashboard
        navigate('/dashboard');
        return;
      }

      // User not subscribed - initiate checkout if plan selected
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
          toast({
            title: 'Erro ao iniciar checkout',
            description: 'Redirecionando para o dashboard...',
            variant: 'destructive',
          });
          navigate('/dashboard');
        }
        setIsCheckoutRedirecting(false);
      } else if (!validPlan) {
        // No plan selected - go to dashboard
        navigate('/dashboard');
      }
    };

    handleAuthenticatedUser();
  }, [user, loading, subscriptionLoading, session, validPlan, subscribed, navigate, toast, isCheckoutRedirecting, awaitingPayment]);

  // Polling while awaiting payment
  useEffect(() => {
    if (!awaitingPayment || !session?.access_token) return;

    const interval = setInterval(async () => {
      await checkSubscription();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [awaitingPayment, session?.access_token, checkSubscription]);

  // Redirect when payment is detected
  useEffect(() => {
    if (awaitingPayment && subscribed) {
      toast({
        title: 'Pagamento confirmado! 🎉',
        description: 'Seu plano foi ativado com sucesso.',
      });
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
        description: error.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : error.message,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Email já cadastrado',
          description: 'Este email já está em uso. Tente fazer login.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar conta',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Conta criada!',
        description: 'Você será redirecionado automaticamente.',
      });
    }
    setIsLoading(false);
  };

  const handleCheckPayment = async () => {
    await checkSubscription();
    if (!subscribed) {
      toast({
        title: 'Pagamento não detectado',
        description: 'Complete o pagamento na aba do Stripe.',
      });
    }
  };

  // Awaiting payment UI
  if (awaitingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
        <Card className="max-w-md w-full text-center shadow-xl border-0">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-primary rounded-2xl shadow-primary">
                <ExternalLink className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Complete o pagamento</CardTitle>
            <CardDescription className="text-base">
              Uma nova aba foi aberta para você finalizar o pagamento no Stripe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Aguardando confirmação...</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta página será atualizada automaticamente assim que o pagamento for confirmado.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                onClick={handleCheckPayment}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Já finalizei o pagamento
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setAwaitingPayment(false);
                  navigate('/dashboard');
                }}
                className="w-full text-muted-foreground"
              >
                Continuar sem assinar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || isCheckoutRedirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {isCheckoutRedirecting && (
          <p className="text-muted-foreground">Preparando checkout...</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-primary rounded-2xl shadow-primary">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">MetrikaPRO</CardTitle>
          {validPlan ? (
            <CardDescription className="text-base">
              Criando conta para o plano <span className="font-semibold text-primary">{STRIPE_PLANS[validPlan].name}</span>
              <br />
              <span className="text-sm">7 dias grátis, depois R$ {STRIPE_PLANS[validPlan].price}/mês</span>
            </CardDescription>
          ) : (
            <CardDescription className="text-base">Acompanhe suas vendas e ROAS em tempo real</CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {/* Google Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 mb-4 flex items-center justify-center gap-3"
            onClick={async () => {
              setIsLoading(true);
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/dashboard`,
                },
              });
              if (error) {
                toast({
                  title: 'Erro ao entrar com Google',
                  description: error.message,
                  variant: 'destructive',
                });
              }
              setIsLoading(false);
            }}
            disabled={isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Continuar com Google'
            )}
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="font-medium">Entrar</TabsTrigger>
              <TabsTrigger value="signup" className="font-medium">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
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
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
