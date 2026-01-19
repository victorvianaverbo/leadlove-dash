import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';

export default function CheckoutSuccessNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { checkSubscription, subscriptionLoading } = useAuth();

  useEffect(() => {
    // Refresh subscription status after successful checkout
    if (sessionId) {
      checkSubscription();
    }
  }, [sessionId, checkSubscription]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-success/50">
        <CardContent className="pt-8 pb-6 text-center">
          {subscriptionLoading ? (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-bold mb-2">Processando...</h2>
              <p className="text-muted-foreground">
                Aguarde enquanto confirmamos sua assinatura.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-bold mb-2">Assinatura Ativada!</h2>
              <p className="text-muted-foreground mb-6">
                Sua assinatura foi ativada com sucesso. Agora você pode criar projetos e acompanhar suas métricas.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Ir para o Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
