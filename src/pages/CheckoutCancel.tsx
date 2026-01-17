import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Checkout Cancelado</h1>
          <p className="text-muted-foreground mb-8">
            O processo de pagamento foi cancelado. Você pode tentar novamente quando quiser.
          </p>

          <div className="flex flex-col gap-3">
            <Button asChild size="lg">
              <Link to="/#pricing">
                <CreditCard className="h-4 w-4 mr-2" />
                Ver Planos
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Tem dúvidas? Entre em contato com nosso suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
