import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowRight, BarChart3 } from 'lucide-react';

export default function CheckoutSuccess() {
  const { checkSubscription } = useAuth();

  useEffect(() => {
    // Refresh subscription status after successful checkout
    checkSubscription();
  }, [checkSubscription]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Assinatura Ativada!</h1>
          <p className="text-muted-foreground mb-8">
            Sua assinatura foi processada com sucesso. Agora você tem acesso completo ao MetrikaPRO.
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
