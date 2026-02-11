import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowRight, BarChart3 } from 'lucide-react';
import { trackEventWithRetry, generateEventId } from '@/lib/meta-pixel';
import { supabase } from '@/integrations/supabase/client';
import { STRIPE_PLANS } from '@/lib/stripe-plans';

export default function CheckoutSuccess() {
  const { checkSubscription, subscriptionTier } = useAuth();
  const [searchParams] = useSearchParams();
  const trackedRef = useRef(false);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    const tier = subscriptionTier || searchParams.get('plan');
    const plan = tier && STRIPE_PLANS[tier as keyof typeof STRIPE_PLANS];
    const value = plan ? plan.price : 97;
    const eventId = generateEventId();

    // Browser-side pixel event (aguarda pixel carregar)
    trackEventWithRetry('Purchase', { value, currency: 'BRL' }, eventId);

    // Server-side CAPI event (deduplication via same event_id)
    supabase.functions.invoke('meta-capi', {
      body: {
        event_name: 'Purchase',
        event_id: eventId,
        value,
        currency: 'BRL',
        user_agent: navigator.userAgent,
        source_url: window.location.href,
      },
    }).catch(console.error);
  }, [subscriptionTier, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Trial Ativado! 🎉</h1>
          <p className="text-muted-foreground mb-4">
            Seus 7 dias de teste grátis começaram agora.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Aproveite para explorar todas as funcionalidades do MetrikaPRO. 
            Você só será cobrado após o período de teste.
          </p>

          <div className="flex flex-col gap-3">
            <Button asChild size="lg">
              <Link to="/dashboard">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ir para o Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Você receberá um email de confirmação em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
