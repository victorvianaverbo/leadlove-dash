import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  hasSubscription: boolean;
  onCreateProject?: () => void;
}

export function EmptyState({ hasSubscription, onCreateProject }: EmptyStateProps) {
  if (!hasSubscription) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center px-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold font-display mb-2">
            Comece sua jornada
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Assine um plano para criar projetos e acompanhar suas métricas de vendas e anúncios.
          </p>
          <Button asChild className="gradient-primary border-0">
            <Link to="/pricing">Ver Planos</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardContent className="py-16 text-center px-6">
        {/* Icon */}
        <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-purple">
          <FolderOpen className="h-10 w-10 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold font-display mb-2">
          Nenhum projeto ainda
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Crie seu primeiro projeto e conecte suas plataformas de anúncios e vendas para começar a analisar seu funil.
        </p>
        
        <Button
          onClick={onCreateProject}
          size="lg"
          className="gradient-primary border-0 shadow-purple-sm hover:shadow-purple transition-shadow"
        >
          <Plus className="h-5 w-5 mr-2" />
          Criar Primeiro Projeto
        </Button>
      </CardContent>
    </Card>
  );
}
