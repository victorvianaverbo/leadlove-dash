import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Target, Zap, Loader2 } from 'lucide-react';

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
      </main>
    </div>
  );
}
