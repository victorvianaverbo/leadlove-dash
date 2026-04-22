import { FolderOpen, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  hasSubscription: boolean;
  onCreateProject?: () => void;
}

export function EmptyState({ hasSubscription, onCreateProject }: EmptyStateProps) {
  if (!hasSubscription) {
    return (
      <Card className="border-dashed border-2 border-border bg-surface">
        <div className="py-16 px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-soft mx-auto mb-5">
            <Sparkles className="h-7 w-7 text-primary" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-xl font-semibold tracking-tight mb-2">
            Comece sua jornada
          </h3>
          <p className="text-muted-foreground mb-7 max-w-sm mx-auto text-sm">
            Assine um plano para criar projetos e acompanhar suas métricas de vendas e anúncios em tempo real.
          </p>
          <Button asChild size="lg">
            <Link to="/pricing">Ver planos</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-2 border-border bg-surface">
      <div className="py-20 px-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-hero mx-auto mb-6 shadow-purple">
          <FolderOpen className="h-9 w-9 text-white" strokeWidth={1.5} />
        </div>

        <h3 className="font-display text-2xl font-semibold tracking-tight mb-2">
          Nenhum projeto ainda
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Crie seu primeiro projeto e conecte suas plataformas de anúncios e vendas para começar a analisar seu funil.
        </p>

        <Button onClick={onCreateProject} size="lg">
          <Plus className="h-5 w-5 mr-2" strokeWidth={2} />
          Criar primeiro projeto
        </Button>
      </div>
    </Card>
  );
}
